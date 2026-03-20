import fs from "fs";
import { parse } from "csv-parse";
import { pipeline } from "stream/promises";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";
import { streamValues } from "stream-json/streamers/StreamValues";

export async function readPreviewFile(filePath: string, limit = 5) {
    const ext = filePath.split(".").pop()?.toLowerCase();

    if (ext === "csv") return await readCsvPreview(filePath, limit);
    if (["json", "jsonl", "ndjson"].includes(ext || "")) return await readJsonPreview(filePath, limit);

    throw new Error(`Unsupported file type: ${ext}`);
}

// ================= CSV =================
async function readCsvPreview(filePath: string, limit: number) {
    return new Promise((resolve, reject) => {
        const rows: any[] = [];
        let columns: string[] = [];
        let totalRows = 0;
        let isResolved = false;

        const parserStream = parse({
            columns: true,
            bom: true,
            relax_column_count: true,
            skip_empty_lines: true,
            trim: true,
        });

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(parserStream);

        parserStream.on("headers", (hdrs) => (columns = hdrs));

        parserStream.on("data", (record) => {
            totalRows++;
            if (rows.length < limit) rows.push(record);
        });

        parserStream.on("end", () => {
            if (!isResolved) {
                isResolved = true;
                resolve({
                    columns: columns.length ? columns : Object.keys(rows[0] || {}),
                    rows,
                    total_rows: totalRows,
                    total_columns: columns.length || Object.keys(rows[0] || {}).length,
                });
            }
        });

        parserStream.on("error", (err) => {
            console.warn("⚠️ CSV parse warning:", err.message);
            if (!isResolved) reject(err);
        });
    });
}




// ================= JSON / NDJSON =================
async function readJsonPreview(filePath: string, limit: number) {
    return new Promise((resolve, reject) => {
        const ext = filePath.split(".").pop()?.toLowerCase();
        const rows: any[] = [];
        let columns: string[] = [];

        // NDJSON hoặc JSON Lines
        if (["jsonl", "ndjson"].includes(ext || "")) {
            const stream = fs.createReadStream(filePath, "utf8");
            let buffer = "";
            stream.on("data", (chunk) => {
                buffer += chunk;
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    try {
                        const obj = JSON.parse(line);
                        rows.push(obj);
                        if (rows.length === 1) columns = Object.keys(obj);
                        if (rows.length >= limit) stream.destroy();
                    } catch { }
                }
            });
            stream.on("end", () => resolve({ columns, rows }));
            stream.on("error", reject);
        } else {
            // JSON chuẩn (array hoặc object)
            const jsonStream = fs.createReadStream(filePath).pipe(parser());
            const arrayStream = jsonStream.pipe(streamArray());
            arrayStream.on("data", (data: { value: any }) => {
                const { value } = data;
                if (typeof value === "object" && value !== null) {
                    rows.push(value);
                    if (rows.length === 1) columns = Object.keys(value);
                    if (rows.length >= limit) arrayStream.destroy();
                }
            });

            arrayStream.on("end", () => resolve({ columns, rows }));
            arrayStream.on("error", reject);
        }
    });
}
