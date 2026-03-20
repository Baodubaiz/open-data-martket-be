// be/src/services/sellerVerificationAi.service.ts
import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

if (!OPENROUTER_API_KEY) {
  console.warn(
    "[SellerVerificationAI] Thiếu biến môi trường OPENROUTER_API_KEY – AI sẽ không chạy, ai_score/ai_analysis sẽ để trống."
  );
}

export type SellerVerificationAIInput = {
  full_name: string;
  id_number: string;
  phone_number?: string | null;
  bank_name: string;
  bank_user_name: string;
  bank_account: string;
  shop_description?: string | null;
  front_image_url: string;
  back_image_url: string;
};

export type SellerVerificationAIResult = {
  score: number | null;
  analysis: string | null;
};

/**
 * Gọi OpenRouter để đánh giá hồ sơ Seller:
 *  - Nhìn (hoặc ít nhất là tham chiếu) 2 ảnh CCCD: front_image_url, back_image_url
 *  - So sánh với thông tin form
 *  - Trả về:
 *      + score: 0–100
 *      + analysis: đoạn ghi chú tiếng Việt cho Admin
 */
export async function runSellerVerificationAI(
  input: SellerVerificationAIInput
): Promise<SellerVerificationAIResult> {
  if (!OPENROUTER_API_KEY) {
    return {
      score: null,
      analysis:
        "AI chưa được cấu hình (thiếu OPENROUTER_API_KEY). Vui lòng cấu hình API key ở backend.",
    };
  }

  const systemPrompt = `
Bạn là hệ thống kiểm duyệt đăng ký SELLER cho sàn giao dịch dữ liệu.

Nhiệm vụ:
1) Đánh giá độ tin cậy của người đăng ký dựa trên thông tin họ cung cấp.
2) Tham chiếu thông tin trên CCCD (từ URL ảnh) so với form: họ tên, số CCCD, mô tả shop, thông tin ngân hàng.
3) Chấm điểm rủi ro 0–100 và viết một đoạn phân tích ngắn gọn cho Admin.

QUAN TRỌNG:
- Trả về DUY NHẤT JSON theo schema sau, không thêm text khác:

{
  "score": 0-100,
  "analysis": "string, tiếng Việt, ngắn gọn, dễ đọc. Nêu:
  - Ảnh CCCD có rõ không (dựa trên mô tả/URL).
  - Thông tin form có hợp lý không.
  - Có dấu hiệu rủi ro / đáng ngờ nào không.
  - Đề xuất: NÊN CHẤP NHẬN / CẦN KIỂM TRA THÊM / NÊN TỪ CHỐI."
}
  `.trim();

  const userPrompt = `
Thông tin user khai trên form:

- Họ tên: ${input.full_name}
- Số CCCD: ${input.id_number}
- Số điện thoại: ${input.phone_number || "(không có)"}
- Ngân hàng: ${input.bank_name}
- Chủ tài khoản: ${input.bank_user_name}
- Số tài khoản: ${input.bank_account}
- Mô tả shop: ${input.shop_description || "(không có)"}

Ảnh CCCD:
- Mặt trước: ${input.front_image_url}
- Mặt sau: ${input.back_image_url}

Hãy trả về JSON đúng schema đã cho. Không giải thích thêm.
`.trim();

  const payload = {
    model: "openai/gpt-4o-mini", // hoặc đổi sang model khác trên OpenRouter nếu bạn muốn
    response_format: { type: "json_object" as const },
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  };

  const res = await axios.post(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "OpenDataMarket Seller Verification",
      },
      timeout: 30000,
    }
  );

  const msg = res.data?.choices?.[0]?.message;
  let raw = msg?.content;

  let jsonText: string;
  if (typeof raw === "string") {
    jsonText = raw;
  } else if (Array.isArray(raw)) {
    jsonText = raw
      .filter((p: any) => p.type === "text" && typeof p.text === "string")
      .map((p: any) => p.text)
      .join("\n");
  } else {
    jsonText = JSON.stringify(raw);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error("[SellerVerificationAI] Không parse được JSON:", err);
    console.error("[SellerVerificationAI] Raw:", jsonText);
    return {
      score: null,
      analysis:
        "AI trả về dữ liệu không đúng định dạng JSON. Vui lòng kiểm tra lại cấu hình model/prompt.",
    };
  }

  const score =
    typeof parsed.score === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.score)))
      : null;

  const analysis =
    typeof parsed.analysis === "string"
      ? parsed.analysis
      : "AI không trả về trường 'analysis'.";

  return {
    score,
    analysis,
  };
}
