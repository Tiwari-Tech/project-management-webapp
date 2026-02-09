import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

//Create task 
export const createTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId, title, description, status, priority, type, assigneeId, due_date } = req.body;
        const origin = req.get('origin');

        // Check if user has admin role for project's workspace
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {members: { include: { user: true } } }
        });
    
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if(project.team_lead !== userId) {
            return res.status(403).json({ message: "Forbidden: You don't have permission to create tasks in this project" });
            
        }
    else if(assigneeId && !project.members.find((member)=> member.user.id === assigneeId)) {
            return res.status(400).json({ message: "Assignee must be a member of the project's workspace" });
        }




        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                status,
                type,
                priority,
                assigneeId: assigneeId || null,
                due_date: due_date ? new Date(due_date) : null,
            },
        });

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true },
        });
await inngest.send({name: "app/task.assigned",
data: {
    taskId: task.id,
    origin,
}});

res.json({task: taskWithAssignee, message: "Task created successfully" } );




    } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
}
    
    }




    //Update task
export const updateTask = async (req, res) => {
    try {

const task = await prisma.task.findUnique({
            where: { id: req.params.id },
        });
if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }



        const { userId } = await req.auth();

        // Check if user has admin role for project's workspace
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: {members: { include: { user: true } } }
        });
    
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if(project.team_lead !== userId) {
            return res.status(403).json({ message: "Forbidden: You don't have permission to create tasks in this project" });
            
        }
const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: req.body,
        });



        

res.json({task: updatedTask, message: "Task updated successfully" } );




    } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
}
    
    }



    //Delete task
export const deleteTask = async (req, res) => {
    try {

        const { userId } = await req.auth();
        const {taskIds} = req.body;
        const tasks = await prisma.task.findMany({
            where: { id: { in: taskIds } },
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Tasks not found" });
        }

        // Check if user has admin role for project's workspace
        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: {members: { include: { user: true } } }
        });
    
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if(project.team_lead !== userId) {
            return res.status(403).json({ message: "Forbidden: You don't have permission to create tasks in this project" });
            
        }
await prisma.task.deleteMany({
            where: { id: { in: taskIds } },
        });
        res.json({ message: "Tasks deleted successfully" });

    } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
}
    
    }