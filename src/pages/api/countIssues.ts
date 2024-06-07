import fs from "fs";
import { parse } from "csv-parse";
import { NextApiRequest, NextApiResponse } from "next";

interface CsvRow {
  URL?: string;
  Violations?: string;
  "Status of issue"?: string;
  Comment?: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  let count = 0;

  fs.createReadStream("accessibility-report-wellington.csv")
    .pipe(parse({ columns: true }))
    .on("data", (row: CsvRow) => {
      if (row.Violations && row.Violations.trim() !== "") {
        count++;
      }
    })
    .on("end", () => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.status(200).json({ count });
    })
    .on("error", (error) => {
      console.error("Error counting issues:", error.message);
      res
        .status(500)
        .json({ error: "Error counting issues", message: error.message });
    });
}
