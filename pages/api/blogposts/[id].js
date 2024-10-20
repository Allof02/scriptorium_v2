import prisma from '../../../lib/prisma';
import { authenticateToken } from '../../../lib/authMiddleware';
import * as Yup from 'yup';

const updateBlogPostSchema = Yup.object().shape({
  title: Yup.string().max(100),
  description: Yup.string().max(500),
  tags: Yup.array().of(Yup.string().max(30)),
  codeTemplates: Yup.array().of(Yup.number()),
  status : Yup.string().oneOf(['PUBLISHED', 'HIDDEN']),
});

async function handler(req, res) {
  const { id } = req.query;
  const blogPostId = parseInt(id);

  if (req.method === 'PUT') {
    return authenticateToken(async (req, res) => {
      try {
        // Validate input
        const validatedData = await updateBlogPostSchema.validate(req.body, { abortEarly: false });

        // Check if the post exists and the user is the author
        const existingPost = await prisma.blogPost.findUnique({
          where: { id: blogPostId },
        });

        if (!existingPost) {
          return res.status(403).json({ error: 'Blog not found' });
        }

        // Either the user is the author or an admin can update the post
        if (existingPost.authorId !== req.user.id && req.user.role !== 'ADMIN') {
          return res.status(403).json({ error: 'You are not allowed to update this post' });
        }

        // If the user is admin, they can update the status of the post
        // remain the status of the post if the status is not updated

        // Start with the existing status of the post
        let status_admin = existingPost.status;

        // If the user is an admin and provided a new status, update it
        if (req.user.role === 'ADMIN' && validatedData.status) {
            status_admin = validatedData.status;
        }


        // Prepare updated data
        const tagConnectOrCreate = validatedData.tags?.map((tagName) => ({
          where: { name: tagName },
          create: { name: tagName },
        }));

        const templateConnect = validatedData.codeTemplates?.map((templateId) => ({
          id: templateId,
        }));

        // Update the blog post
        const updatedPost = await prisma.blogPost.update({
          where: { id: blogPostId },
          data: {
            title: validatedData.title,
            description: validatedData.description,
            status: status_admin,
            tags: tagConnectOrCreate ? { set: [], connectOrCreate: tagConnectOrCreate } : undefined,
            codeTemplates: templateConnect ? { set: [], connect: templateConnect } : undefined,
          },
          include: {
            tags: true,
            codeTemplates: true,
          },
        });

        res.status(200).json({ message: 'Blog post updated successfully', blogPost: updatedPost });
      } catch (error) {
        if (error.name === 'ValidationError') {
          return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
      }
    })(req, res);
  } else if (req.method === 'DELETE') {
    return authenticateToken(async (req, res) => {
      const existingPost = await prisma.blogPost.findUnique({
        where: { id: blogPostId },
      });
  
      if (!existingPost || existingPost.authorId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
  
      await prisma.blogPost.delete({
        where: { id: blogPostId },
      });
  
      res.status(200).json({ message: 'Blog post deleted successfully' });
    })(req, res);
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default handler;
