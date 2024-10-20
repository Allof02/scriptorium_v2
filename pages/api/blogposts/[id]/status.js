import prisma from '../../../../lib/prisma';
import { authenticateTokenAndRole } from '../../../../lib/authMiddleware';

async function handler(req, res) {
  const { id } = req.query;
  const blogPostId = parseInt(id);

  if (req.method === 'PUT') {
    return authenticateTokenAndRole(['ADMIN'])(req, res, async () => {
      try {
        const { status } = req.body;

        // Validate status
        if (!['PUBLISHED', 'HIDDEN'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }

        // Update the status of the blog post
        const updatedBlogPost = await prisma.blogPost.update({
          where: { id: blogPostId },
          data: { status },
        });

        res.status(200).json({ message: 'Status updated successfully', blogPost: updatedBlogPost });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default handler;
