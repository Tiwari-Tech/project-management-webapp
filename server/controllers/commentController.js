import prisma from "../configs/prisma.js";

// Add comment to a project'
export const addComment = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId, content } = req.body;

        //Check if user is member of the project's workspace
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        const member = project.members.find((member) => member.userId === userId);


        if (!member) {
            return res.status(403).json({ message: "Forbidden: You don't have permission to comment on this task" });
        }

        const comment = await prisma.comment.create({
            data: { taskId, content, userId },
            include: { user: true },
        });
res.json({ comment, message: "Comment added successfully" });





    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
}   

// Get comments for a task
export const getComments = async (req, res) => {
    try {
        const { taskId } = req.params;
        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: { user: true },
        });
        res.json({ comments });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
}
