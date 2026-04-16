import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ 
    message: "Test webhook endpoint works!",
    method: req.method,
    url: req.url
  });
}