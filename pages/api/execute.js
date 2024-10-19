import { executeCode } from '../../lib/executeCode';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { code, language, stdin } = req.body;

    // Basic validation
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    const supportedLanguages = ['python', 'javascript', 'c', 'cpp', 'java'];

    if (!supportedLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    try {
      const result = await executeCode({ code, language, stdin });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Execution error', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}