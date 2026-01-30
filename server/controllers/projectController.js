import prisma from "../configs/prisma.js";


// create a new project
export const createProject = async (req, res) => {
    try {
        const { userId } = req.auth;
        const {
            workspaceId,
            name,
            description,
            status,
            start_date,
            end_date,
            teamMembers,
            team_lead,
            progress,
            priority,
        } = req.body;

        // Check if user has admin role for workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } },
        });
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        if (!workspace.members.some((member) => member.userId === userId && member.role === "ADMIN")) {
            return res.status(403).json({
                message: "Forbidden: You don't have permission to create a project in this workspace",
            });
        }

        // Get team lead using email
        const teamLeadUser = team_lead
            ? await prisma.user.findUnique({
                  where: { email: team_lead },
                  select: { id: true },
              })
            : null;

        const project = await prisma.project.create({
            data: {
                workspaceId,
                name,
                description,
                status,
                priority,
                progress,
                team_lead: teamLeadUser?.id || null,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            },
        });

        // Add team members to project if they are in workspace
        if (teamMembers?.length > 0) {
            const membersToAdd = [];
            workspace.members.forEach((member) => {
                if (teamMembers.includes(member.user.email)) {
                    membersToAdd.push(member.user.id);
                }
            });

            if (membersToAdd.length > 0) {
                await prisma.projectMember.createMany({
                    data: membersToAdd.map((memberId) => ({
                        projectId: project.id,
                        userId: memberId,
                    })),
                });
            }
        }

        const projectWithMembers = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                members: { include: { user: true } },
                tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                owner: true,
            },
        });

        res.json({ project: projectWithMembers, message: "Project created successfully" });



    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
}


// Update a project
export const updateProject = async (req, res) => {
    try {
        const { userId } = req.auth;
        const { projectId } = req.params;
        const {
            workspaceId,
            name,
            description,
            status,
            start_date,
            end_date,
            team_lead,
            progress,
            priority,
        } = req.body;

        const existingProject = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: { include: { members: { include: { user: true } } } },
            },
        });

        if (!existingProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        const workspace = existingProject.workspace;
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (!workspace.members.some((member) => member.userId === userId && member.role === "ADMIN")) {
            if (existingProject.team_lead !== userId) {
                return res.status(403).json({
                    message: "Forbidden: You don't have permission to update this project",
                });
            }
        }

        let teamLeadId = existingProject.team_lead;
        if (team_lead) {
            const teamLeadUser = await prisma.user.findUnique({
                where: { email: team_lead },
                select: { id: true },
            });
            if (teamLeadUser) {
                teamLeadId = teamLeadUser.id;
            }
        }

        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                name,
                description,
                workspaceId: workspaceId || existingProject.workspaceId,
                status,
                priority,
                progress,
                team_lead: teamLeadId,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            },
        });

        res.json({ project, message: "Project updated successfully" });


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
}

// Add a member to a project
export const addMember = async (req, res) => {
    try {
        const { userId } = req.auth;
        const { projectId } = req.params;
        const { email } = req.body;

        // Check if user is project lead
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } },
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        if (project.team_lead !== userId) {
            return res.status(403).json({
                message: "Forbidden: You don't have permission to add members to this project",
            });
        }

        // Check if user is already a member
        const existingMember = project.members.find((member) => member.user.email === email);
        if (existingMember) {
            return res.status(400).json({ message: "User is already a member of this project" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const member = await prisma.projectMember.create({
            data: {
                userId: user.id,
                projectId,
            },
        });

        res.json({ member, message: "Member added to project successfully" });



    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
}