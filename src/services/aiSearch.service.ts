// be/src/services/aiSearch.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const APP_DOMAIN = process.env.APP_DOMAIN || "http://localhost:3000";
const APP_TITLE =
  process.env.APP_TITLE || "OpenDataMarket AI Dataset Helper";

/**
 * Stopwords: các từ chung chung, bỏ đi khi tách từ khóa.
 */
const STOPWORDS = [
  "data",
  "dataset",
  "dữ",
  "liệu",
  "bộ",
  "ai",
  "ml",
  "model",
  "project",
  "tôi",
  "mình",
  "em",
  "anh",
  "chị",
  "đang",
  "làm",
  "về",
  "cần",
  "muốn",
  "tìm",
  "the",
  "a",
  "an",
  "of",
  "for",
  "about",
  "my",
  "your",
  "our",
  "this",
  "that",
];

/**
 * Từ đồng nghĩa Anh ↔ Việt cơ bản để đảm bảo search được
 * ngay cả khi AI fail. (fruit -> trái cây, mango -> xoài, ...)
 */
const SYNONYM_MAP: Record<string, string[]> = {
  fruit: ["trái cây", "hoa quả", "trái"],
  fruits: ["trái cây", "hoa quả", "trái"],
  vegetable: ["rau củ", "rau", "thực vật"],
  vegetables: ["rau củ", "rau", "thực vật"],
  mango: ["xoài", "trái xoài", "trái cây"],
  apple: ["táo", "trái táo", "trái cây"],
  orange: ["cam", "trái cam", "trái cây"],
  banana: ["chuối", "trái chuối", "trái cây"],
  "dragon": ["thanh long", "trái thanh long", "trái cây"],
  "dragonfruit": ["thanh long", "trái thanh long", "trái cây"],
  "dragon-fruit": ["thanh long", "trái thanh long", "trái cây"],
};

/**
 * Thông tin ràng buộc giá tiền trích từ câu hỏi.
 */
type PriceConstraint = {
  minPrice?: number; // VND
  maxPrice?: number; // VND
};

/**
 * Hàm chính: nhận query từ FE, nhờ AI chuẩn hóa từ khóa + trích giá,
 * rồi tìm dataset trong DB, có fallback khi không match đúng giá.
 */
export const searchByQuery = async (rawQuery: string) => {
  const query = (rawQuery || "").trim();

  if (!query) {
    return {
      reply:
        "Bạn hãy mô tả bài toán hoặc loại dataset bạn cần, ví dụ: 'AI nhận diện trái cây từ ảnh'.",
      datasets: [],
    };
  }

  // ===== 1. Tách từ khóa thô từ câu người dùng =====
  const baseWords = extractBaseWords(query);

  // ===== 2. Nhờ AI chuẩn hóa / mở rộng từ khóa (đa ngôn ngữ, ngữ nghĩa) =====
  const aiKeywords = await expandKeywordsWithAI(query, baseWords);

  // ===== 3. Gộp baseWords + aiKeywords + synonyms (Anh ↔ Việt) =====
  let allKeywordsSet = new Set<string>();

  const pushKeyword = (kw: string) => {
    const k = kw.trim();
    if (!k) return;
    if (STOPWORDS.includes(k.toLowerCase())) return;
    allKeywordsSet.add(k);
    // thêm synonyms nếu có
    const syns = SYNONYM_MAP[k.toLowerCase()];
    if (syns) {
      for (const s of syns) {
        if (s && !STOPWORDS.includes(s.toLowerCase())) {
          allKeywordsSet.add(s);
        }
      }
    }
  };

  baseWords.forEach(pushKeyword);
  aiKeywords.forEach(pushKeyword);

  const allKeywords = Array.from(allKeywordsSet);

  // Nếu sau tất cả mà không còn keyword cụ thể -> câu hỏi quá chung chung
  if (!allKeywords.length) {
    return {
      reply:
        "Từ khóa bạn nhập hơi chung chung (ví dụ chỉ có 'data' hoặc 'dataset'). " +
        "Bạn thử mô tả rõ hơn loại dữ liệu hoặc bài toán AI bạn cần nhé, ví dụ: 'data trái cây', 'data máy móc', 'AI nhận diện ảnh y tế'…",
      datasets: [],
    };
  }

  // ===== 4. Trích thông tin ràng buộc giá từ câu hỏi =====
  const priceConstraint = extractPriceConstraint(query);

  // ===== 5. Tìm dataset trong DB với từ khóa + giá (nếu có) =====
  let datasets = await findDatasetsByKeywords(allKeywords, priceConstraint);
  let relaxedByPrice = false;

  // Nếu có ràng buộc giá nhưng không tìm được gì:
  // -> relax giá (bỏ filter giá, chỉ giữ từ khóa) và gợi ý cho user.
  if (!datasets.length && (priceConstraint.minPrice || priceConstraint.maxPrice)) {
    datasets = await findDatasetsByKeywords(allKeywords, null);
    if (datasets.length) {
      relaxedByPrice = true;
    }
  }

  // ===== 6. Không có dataset phù hợp nào hết =====
  if (!datasets.length) {
    return {
      reply:
        "Rất tiếc, dataset đúng nhu cầu của bạn hiện chưa có trong hệ thống. " +
        "Mình có thể gợi ý các loại dataset khác gần giống, nếu cần bạn hãy mô tả thêm giúp mình nhé.",
      datasets: [],
    };
  }

  // ===== 7. Có dataset → gọi OpenRouter viết câu gợi ý ngắn =====
  const reply = await buildAiReply(
    query,
    allKeywords,
    datasets,
    priceConstraint,
    relaxedByPrice
  );

  return {
    reply,
    datasets,
  };
};

/**
 * Tách các từ khoá cơ bản từ câu query, bỏ stopwords.
 * Ví dụ: "tôi đang làm về data thanh long" -> ["thanh", "long"]
 */
function extractBaseWords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-zA-Z0-9À-ỹ]+/u)
    .filter((w) => w.length > 2 && !STOPWORDS.includes(w));
}

/**
 * Gọi OpenRouter để:
 *  - Hiểu câu hỏi (tiếng Việt + tiếng Anh),
 *  - Quy về các từ khóa chính (ưu tiên tiếng Việt),
 *  - Mở rộng ngữ nghĩa: fruit -> trái cây, dragon fruit -> thanh long, ...
 *  - Có thể suy luận thêm domain: trái cây, nông nghiệp, hình ảnh, ...
 */
async function expandKeywordsWithAI(
  query: string,
  baseWords: string[]
): Promise<string[]> {
  if (!OPENROUTER_API_KEY) return baseWords;

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": APP_DOMAIN,
        "X-Title": APP_TITLE,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Bạn là trợ lý chuẩn hóa từ khóa cho hệ thống tìm kiếm dataset. " +
              "Người dùng có thể hỏi bằng tiếng Việt hoặc tiếng Anh. " +
              "Nhiệm vụ của bạn: \n" +
              "1) Hiểu nội dung câu hỏi (ví dụ: 'tôi đang làm về quả thanh long', 'fruit dataset', 'data dragon fruit dưới 20k').\n" +
              "2) Trả về danh sách từ khóa NGẮN, ưu tiên TIẾNG VIỆT, dùng để tìm dataset: " +
              "   - Bao gồm khái niệm tổng quát (vd: 'trái cây', 'hoa quả', 'nông nghiệp', 'hình ảnh', 'time-series', 'văn bản', 'máy móc').\n" +
              "   - Bao gồm các từ khoá cụ thể nếu cần (vd: 'thanh long', 'mango', 'sensor', 'công nghiệp').\n" +
              "3) Không cần xử lý giá tiền ở đây.\n" +
              "4) Nếu từ khóa quá chung chung như chỉ có 'data', 'dataset', 'AI' thì trả về mảng rỗng.\n" +
              "5) Chỉ trả về JSON THUẦN theo format: {\"keywords\": [\"...\"]}.",
          },
          {
            role: "user",
            content:
              "Câu hỏi của người dùng là: " +
              query +
              ". Các từ gốc đã tách được là: " +
              JSON.stringify(baseWords),
          },
        ],
      }),
    });

    if (!resp.ok) {
      console.error("expandKeywordsWithAI error:", resp.status);
      return baseWords;
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "";

    // Một số model trả JSON trong ```json ...```, nên cần bóc ra.
    const cleaned = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      const aiKeywords: string[] = Array.isArray(parsed.keywords)
        ? parsed.keywords
        : [];
      return aiKeywords.map((k) => k.trim()).filter(Boolean);
    } catch (err) {
      console.error("expandKeywordsWithAI JSON parse error:", err, content);
      return baseWords;
    }
  } catch (err) {
    console.error("expandKeywordsWithAI exception:", err);
    return baseWords;
  }
}

/**
 * Trích ràng buộc giá từ câu hỏi.
 * Ví dụ:
 *  - "dưới 20k", "under 20k", "less than 20000" -> maxPrice = 20000
 *  - "trên 20k", "hơn 20k", "more than 20k"     -> minPrice = 20000
 */
function extractPriceConstraint(query: string): PriceConstraint {
  const q = query.toLowerCase();

  // tìm số đầu tiên trong câu
  const numMatch = q.match(/(\d+)\s*(k|nghìn|ngàn|000)?/);
  if (!numMatch) return {};

  let value = parseInt(numMatch[1], 10);
  const unit = numMatch[2];

  if (unit === "k" || unit === "nghìn" || unit === "ngàn") {
    value = value * 1000;
  } else if (unit === "000") {
    // 20 000 -> 20 + '000' đã nằm trong chuỗi, nên không nhân nữa
  }

  const constraint: PriceConstraint = {};

  const hasUnder =
    q.includes("dưới") || q.includes("under") || q.includes("less than") || q.includes("<");
  const hasOver =
    q.includes("trên") ||
    q.includes("hơn") ||
    q.includes("ít nhất") ||
    q.includes("từ") ||
    q.includes("greater than") ||
    q.includes("more than") ||
    q.includes(">");

  if (hasUnder && !hasOver) {
    // Dưới value (cho phép <= để user dễ hiểu)
    constraint.maxPrice = value;
  } else if (hasOver && !hasUnder) {
    // Trên value (>=)
    constraint.minPrice = value;
  }

  // Nếu user chỉ nói "khoảng 20k" mà không có dưới/trên -> tạm thời không áp giá
  return constraint;
}

/**
 * Tìm dataset trong DB bằng danh sách từ khóa đã chuẩn hóa + ràng buộc giá (nếu có).
 */
async function findDatasetsByKeywords(
  keywords: string[],
  priceConstraint: PriceConstraint | null
) {
  const orConditions: any[] = [];

  for (const w of keywords) {
    orConditions.push(
      {
        title: {
          contains: w,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: w,
          mode: "insensitive",
        },
      },
      {
        tags: {
          some: {
            name: {
              contains: w,
              mode: "insensitive",
            },
          },
        },
      }
    );
  }

  if (!orConditions.length) {
    return [];
  }

  const where: any = {
    is_active: true,
    OR: orConditions,
  };

  // Thêm filter giá nếu có
  if (priceConstraint && (priceConstraint.minPrice || priceConstraint.maxPrice)) {
    where.price_vnd = {};
    if (priceConstraint.minPrice) {
      where.price_vnd.gte = priceConstraint.minPrice;
    }
    if (priceConstraint.maxPrice) {
      where.price_vnd.lte = priceConstraint.maxPrice;
    }
  }

  const datasets = await prisma.dataset.findMany({
    where,
    include: {
      seller: { select: { user_id: true, full_name: true } },
      category: true,
      tags: true,
      reviews: true,
    },
    orderBy: { created_at: "desc" },
    take: 30,
  });

  return datasets;
}

/**
 * Gọi OpenRouter để viết 1–2 câu gợi ý ngắn về các dataset đã match.
 * Nếu phải relax điều kiện giá, AI sẽ nói rõ để user hiểu.
 */
async function buildAiReply(
  originalQuery: string,
  keywords: string[],
  datasets: any[],
  priceConstraint: PriceConstraint,
  relaxedByPrice: boolean
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    if (relaxedByPrice && priceConstraint.maxPrice) {
      return (
        "Mình không tìm được dataset đúng tiêu chí giá bạn đặt ra, " +
        "nhưng đây là một số bộ dữ liệu gần nhất về chủ đề bạn quan tâm. Bạn xem thử nhé."
      );
    }
    return (
      "Mình đã tìm được một số dataset khá phù hợp với nhu cầu của bạn, " +
      "bạn xem danh sách bên dưới nhé."
    );
  }

  const listText = datasets
    .map((d, idx) => {
      const tagNames =
        d.tags?.map((t: { name: string }) => t.name).join(", ") || "";
      return `${idx + 1}. ${d.title} - ${
        d.description ?? ""
      }${tagNames ? ` (Tags: ${tagNames})` : ""} (Giá: ${
        d.price_vnd != null ? d.price_vnd.toLocaleString("vi-VN") + " VND" : "N/A"
      })`;
    })
    .join("\n");

  const priceNoteParts: string[] = [];
  if (priceConstraint?.maxPrice) {
    priceNoteParts.push(
      `giá tối đa khoảng ${priceConstraint.maxPrice.toLocaleString("vi-VN")} VND`
    );
  }
  if (priceConstraint?.minPrice) {
    priceNoteParts.push(
      `giá tối thiểu khoảng ${priceConstraint.minPrice.toLocaleString("vi-VN")} VND`
    );
  }

  const priceText = priceNoteParts.length
    ? priceNoteParts.join(" và ")
    : "không có ràng buộc giá rõ ràng";

  const relaxText = relaxedByPrice
    ? "Lưu ý: không tìm được dataset đúng tiêu chí giá, nên mình gợi ý những bộ gần nhất về nội dung."
    : "Các dataset bên dưới đều nằm trong phạm vi giá (nếu người dùng có đề cập).";

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": APP_DOMAIN,
      "X-Title": APP_TITLE,
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Bạn là trợ lý gợi ý dataset cho sàn OpenDataMarket. " +
            "Người dùng mô tả nhu cầu dataset bằng tiếng Việt hoặc tiếng Anh. " +
            "Hệ thống đã chuẩn hóa danh sách từ khóa, trích ràng buộc giá (nếu có) và tìm được một số dataset phù hợp. " +
            "Nhiệm vụ của bạn: trả lời BẰNG TIẾNG VIỆT, tối đa 1–2 câu, không quá 40 từ. " +
            "Giọng thân thiện, xưng 'Mình'. " +
            "Hãy: 1) công nhận nhu cầu người dùng, 2) nói ngắn gọn là các dataset liệt kê bên dưới khá phù hợp với các từ khóa/giá đó, " +
            "3) nếu hệ thống phải relax điều kiện giá thì nhắc nhẹ để người dùng hiểu, 4) mời người dùng mô tả thêm nếu cần dataset chi tiết hơn.\n\n" +
            "TỪ KHÓA ĐÃ CHUẨN HÓA: " +
            JSON.stringify(keywords) +
            "\n" +
            "THÔNG TIN GIÁ: " +
            priceText +
            "\n" +
            relaxText +
            "\n\n" +
            "DANH SÁCH DATASET PHÙ HỢP:\n" +
            listText,
        },
        {
          role: "user",
          content:
            "Câu hỏi ban đầu của mình là: " +
            originalQuery +
            ". Hãy gợi ý ngắn cho mình dựa trên các dataset trên.",
        },
      ],
    }),
  });

  if (!resp.ok) {
    console.error("buildAiReply error status:", resp.status);
    if (relaxedByPrice && priceConstraint.maxPrice) {
      return (
        "Mình không tìm được dataset đúng tiêu chí giá bạn đặt ra, " +
        "nhưng đây là một số bộ dữ liệu gần nhất về chủ đề bạn quan tâm. Bạn xem thử nhé."
      );
    }
    return (
      "Mình đã tìm được một số dataset khá phù hợp với nhu cầu của bạn, " +
      "bạn xem danh sách bên dưới nhé."
    );
  }

  const data = await resp.json();
  return (
    data?.choices?.[0]?.message?.content?.trim() ||
    (relaxedByPrice && priceConstraint.maxPrice
      ? "Mình không tìm được dataset đúng tiêu chí giá bạn đặt ra, nhưng đây là một số bộ dữ liệu gần nhất về chủ đề bạn quan tâm."
      : "Mình đã tìm được một số dataset khá phù hợp với nhu cầu của bạn, bạn xem danh sách bên dưới nhé.")
  );
}
