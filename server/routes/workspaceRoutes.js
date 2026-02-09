import express from 'express';
import { getWorkspaces, addMember, createWorkspace } from '../controllers/workspaceController.js';


const workspaceRoutes = express.Router();
workspaceRoutes.get('/', getWorkspaces)
workspaceRoutes.post('/', createWorkspace)
workspaceRoutes.post('/add-member', addMember)

export default workspaceRoutes;

