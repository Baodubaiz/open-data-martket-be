import { Request, Response } from "express";
import * as aiSearchService from "../services/aiSearch.service";

export const search = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res
        .status(400)
        .json({ error: "query is required and must be a non-empty string" });
    }

    const result = await aiSearchService.searchByQuery(query);
    return res.json(result); // { reply, datasets }
  } catch (error) {
    console.error("AI search error:", error);
    return res.status(500).json({
      reply:
        "Có lỗi xảy ra khi mình xử lý yêu cầu này. Bạn thử lại sau giúp mình nhé.",
      datasets: [],
    });
  }
};
