import prisma from "../configs/prisma.js";

// Create a new workspace
export const createWorkspace = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id, name, slug, description, image_url } = req.body;

        // Validate required fields
        if (!id || !name) {
            return res.status(400).json({ message: "Id and name are required" });
        }

        // Generate slug if not provided
        const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Check if workspace with this id already exists
        const existingWorkspace = await prisma.workspace.findFirst({
            where: { id }
        });

        if (existingWorkspace) {
            console.log(`Workspace with id ${id} already exists`);
            return res.status(400).json({ message: "Workspace already exists" });
        }

        // Ensure user exists in database (create if not)
        let user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            // User doesn't exist in database, create it
            user = await prisma.user.create({
                data: {
                    id: userId,
                    name: "User",
                    email: `user_${userId}@workspace.local`,
                    image: ""
                }
            });
        }

        // Create the workspace
        const workspace = await prisma.workspace.create({
            data: {
                id,
                name,
                slug: finalSlug,
                description: description || "",
                image_url: image_url || "",
                ownerId: userId,
                members: {
                    create: {
                        userId: userId,
                        role: "ADMIN"
                    }
                }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: {
                            include: {
                                assignee: true,
                                comments: {
                                    include: { user: true }
                                }
                            }
                        },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });

        console.log(`Workspace ${id} created successfully for user ${userId}`);
        res.json({ workspace, message: "Workspace created successfully" });
    } catch (error) {
        console.log("Workspace creation error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get all Workspaces of the users
export const getWorkspaces = async (req, res) => {
    try{
        const {userId} = await req.auth();
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {
                    some: {
                        userId: userId,
                    }
                }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });

        res.json({workspaces});
    }catch(error){
        console.log(error);
        res.status(500).json({message: error.code || error.message});
    }
};

// Add members to workspace
export const addMember = async (req, res) => {
    try{
        const {userId} = await req.auth();
        const {email, role, workspaceId, message} = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({where: {email}});
        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        if(!workspaceId || !role){
            return res.status(400).json({message: "Missing required fields"});
        }

        if(!['ADMIN','MEMBER'].includes(role)){
            return res.status(400).json({message: "Invalid role"});
        }

        //fetch workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });
        if(!workspace){
            return res.status(404).json({message: "Workspace not found"});
        }   

        // Check creator has admin role
        if(!workspace.members.find((member) => member.userId === userId && member.role === 'ADMIN')){
            return res.status(403).json({message: "Only admins can add members"});
        }

        // Check if user is already a member
        const existingMember = workspace.members.find((member) => member.userId === user.id);
        if(existingMember){
            return res.status(400).json({message: "User is already a member of the workspace"});
        }   

        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId,
                role,
                message,
            }
        });

        res.json({member, message: "Member added successfully"});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.code || error.message});
    }
};
