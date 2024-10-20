import prisma from '../../../../lib/prisma';
import { authenticateToken } from '../../../../lib/authMiddleware';

async function handler(req, res) {
  const { id } = req.query;
  const templateId = parseInt(id);

  if (req.method === 'POST') {
    try {
      const existingTemplate = await prisma.codeTemplate.findUnique({
        where: { id: templateId },
        include: {
          tags: true,
        },
      });

      if (!existingTemplate) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Create a new template as a fork
      const forkedTemplate = await prisma.codeTemplate.create({
        data: {
          title: existingTemplate.title + ' (Forked)',
          code: existingTemplate.code,
          language: existingTemplate.language,
          explanation: existingTemplate.explanation,
          author: { connect: { id: req.user.id } },
          authorId: req.user.id,
          parent: { connect: { id: existingTemplate.id } },
          parentID: existingTemplate.id,
          isFork: true,
          tags: {
            connect: existingTemplate.tags.map((tag) => ({ id: tag.id })),
          },
        },
        include: {
          tags: true,
        },
      });

      res.status(201).json({ message: 'Template forked successfully', template: forkedTemplate });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default authenticateToken(handler);
