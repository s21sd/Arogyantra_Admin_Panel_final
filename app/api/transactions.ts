import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" })

  const { pathologyId } = req.query
  if (!pathologyId) return res.status(400).json({ error: "Pathology ID is required" })

  try {

    res.status(200).json(IDBTransaction)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}
