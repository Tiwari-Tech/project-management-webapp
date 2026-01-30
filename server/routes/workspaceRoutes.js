import express from 'express';
import { getWorkspaces, addMember } from '../controllers/workspaceController.js';


const workspaceRoutes = express.Router();
workspaceRoutes.get('/', getWorkspaces)
workspaceRoutes.post('/add-member', addMember)

export default workspaceRoutes;
