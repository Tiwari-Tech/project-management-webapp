import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import sendEmail from "../configs/nodemailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

// Inngest function to save user data to a database

const syncUserCreation = inngest.createFunction(
    {id: 'sync/user-data-from-clerk'},
    {event: 'clerk/user.created'},
    async ({ event }) => {
        const {data} = event;
        await prisma.user.create({
            data: {
                id: data.id,
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + ' ' + data?.last_name, 
                image: data?.image_url,
            }
        })
    }
);


// Inngest function to delete user data from a database

const syncUserDeletion = inngest.createFunction(
    {id: 'delete/user-with-clerk'},
    {event: 'clerk/user.deleted'},
    async ({ event }) => {
        const {data} = event;
        await prisma.user.delete({
            where: {
               id: data.id,
            }
        })
    }
);



// Inngest function to update user data from a database
const syncUserUpdation = inngest.createFunction(
    {id: 'update-user-from-clerk'},
    {event: 'clerk/user.updated'},
    async ({ event }) => {
        const {data} = event;
        await prisma.user.update({
            where: {
                id: data.id,
            },
            data: {
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + ' ' + data?.last_name, 
                image: data?.image_url,
            }
        })
    }
);

//Inngest function to save workspace data to a database
const syncWorkspaceCreation = inngest.createFunction(
    {id: 'sync/workspace-data-from-clerk'},
    {event: 'clerk/organization.created'},
    async ({ event }) => {
        const {data} = event;
        try {
            await prisma.workspace.create({
                data: {
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    ownerId: data.created_by,
                    image_url: data.image_url,
                }
            })

            // Add creator as admin memeber
            await prisma.workspaceMember.create({
                data: {
                    userId: data.created_by,
                    workspaceId: data.id,
                    role: "ADMIN",
                }
            })
        } catch (error) {
            console.log('Error creating workspace:', error);
        }
    }
);


// Inngest function to update workspace data from a database
const syncWorkspaceUpdation = inngest.createFunction(
    {id: 'update-workspace-from-clerk'},
    {event: 'clerk/organization.updated'},
    async ({ event }) => {
        const {data} = event;
        await prisma.workspace.update({
            where: {
                id: data.id,
            },
            data: {
                name: data.name,
                slug: data.slug,
                image_url: data.image_url,
            }
        })
    }   
);


// Inngest function to delete workspace data from a database
const syncWorkspaceDeletion = inngest.createFunction(
    {id: 'delete-workspace-with-clerk'},
    {event: 'clerk/organization.deleted'},
    async ({ event }) => {
        const {data} = event;   
        await prisma.workspace.delete({
            where: {
               id: data.id,
            }
        })
    }
);



// Inngest function to save workspace member data to a database
const syncWorkspaceMemberCreation = inngest.createFunction(
    {id: 'sync/workspace-member-from-clerk'},   
    {event: 'clerk/organizationInvitation.accepted'},
    async ({ event }) => {
        const {data} = event;
        await prisma.workspaceMember.create({
            data: {
                userId: data.user_id,
                workspaceId: data.organization_id,
                role: String(data.role_name).toUpperCase(),
            }
        })
    }
);

// Inngest function to send email on task assignment
const sendTaskAssignmentEmail = inngest.createFunction(
    {id: 'send-task-assignment-email'},
    {event: 'app/task.assigned'},
        async ({ event, step }) => {
                const { taskId, origin } = event.data;

                const task = await prisma.task.findUnique({
                        where: { id: taskId },
                        include: { assignee: true, project: true },
                });

                if (!task?.assignee?.email) return;

                const appOrigin = origin || process.env.CLIENT_URL || "";

                await sendEmail(
                        task.assignee.email,
                        `New Task Assigned: ${task.project.name}`,
                        `<div style="max-width: 600px;">
                                <h2>Hi ${task.assignee.name}</h2>

                                <p style="font-size: 16px;">You have been assigned a new task: ${task.title}</p>
                                <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">${task.title}</p>
                                <div style="border: 1px solid #ddd; padding: 12px 16px; border-radius: 6px; margin-bottom: 30px;">
                                        <p style="margin: 6px 0;"><strong>Description:</strong> ${task.description}</p>
                                        <p style="margin: 6px 0;"><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>
                                </div>
                                <a href="${appOrigin}" style="background-color: #007bff; padding: 12px 24px; border-radius: 5px; color: #fff; font-weight: 600; font-size: 16px; text-decoration: none;">
                                        View Task
                                </a>
                                <p style="margin-top: 20px; font-size: 14px; color: #6c757d;">
                                        Please make sure to review and complete it before the due date.
                                </p>
                        </div>`
                );

                if (new Date(task.due_date).toDateString() !== new Date().toDateString()) {
                        await step.sleepUntil("wait-until-due-date", new Date(task.due_date));
                }

                await step.run("Check if task is completed", async () => {
                        const latestTask = await prisma.task.findUnique({
                                where: { id: taskId },
                                include: { assignee: true, project: true },
                        });

                        if (!latestTask) return;
                        if (latestTask.status !== "completed") {
                                await sendEmail(
                                        latestTask.assignee.email,
                                        `Reminder: Task "${latestTask.title}" is due today`,
                                        `<div style="max-width: 600px;">
    <h2>Hi ${latestTask.assignee.name}, 👋</h2>

    <p style="font-size: 16px;">You have a task due in ${latestTask.project.name}:</p>
    <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">
        ${latestTask.title}
    </p>

    <div style="border: 1px solid #ddd; padding: 12px 16px; border-radius: 6px; margin-bottom: 30px;">
        <p style="margin: 6px 0;">
    <strong>Description:</strong> ${latestTask.description}
</p>
<p style="margin: 6px 0;">
    <strong>Due Date:</strong> ${new Date(latestTask.due_date).toLocaleDateString()}
</p>
</div>

<a href="${appOrigin}" style="background-color: #007bff; padding: 12px 24px; border-radius: 5px; color: #fff; font-weight: 600; font-size: 16px; text-decoration: none;">
    View Task
</a>
<p style="margin-top: 20px; font-size: 14px; color: #6c757d;">
    Please make sure to review and complete it before the due date.
</p>
</div>`
                                );
                        }
                });
        }
);




// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation,
    sendTaskAssignmentEmail,

];