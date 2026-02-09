import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { Loader2Icon, AlertCircle } from 'lucide-react'
import { useUser, SignIn, useAuth, CreateOrganization, useOrganizationList } from "@clerk/clerk-react";
import { fetchWorkspaces } from '../features/workspaceSlice'
import api from '../configs/api'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
    const [creationError, setCreationError] = useState(null)
    const [hasAttemptedOrgCreation, setHasAttemptedOrgCreation] = useState(false)
    const { workspaces } = useSelector((state) => state.workspace)
    const dispatch = useDispatch()
    const {user, isLoaded} = useUser();
    const { setActive, userMemberships, isLoaded: orgsLoaded } = useOrganizationList({ userMemberships: true });
    const {getToken} = useAuth();

    // Initial load of theme
    useEffect(() => {
        dispatch(loadTheme())
    }, [dispatch])

    // Initial load of workspaces on mount - only run once
    useEffect(() => {
        let isMounted = true;
        
        const initializeWorkspaces = async () => {
            if (isLoaded && user) {
                console.log('Initial workspace fetch triggered');
                try {
                    await dispatch(fetchWorkspaces({ getToken }));
                    if (isMounted) {
                        console.log('Workspaces fetched successfully');
                    }
                } catch (error) {
                    console.error('Error fetching workspaces:', error);
                }
            }
        };
        
        initializeWorkspaces();
        
        return () => {
            isMounted = false;
        };
    }, [dispatch, getToken, isLoaded, user])

    // Create workspace when organization is created in Clerk
    useEffect(() => {
        const org = userMemberships?.data?.[0]?.organization;
        
        console.log('Workspace creation check:', {
            isLoaded,
            orgsLoaded,
            user: !!user,
            org: !!org,
            workspacesCount: workspaces.length,
            isCreatingWorkspace,
            hasAttemptedOrgCreation,
            orgId: org?.id
        });
        
        // Only try to create workspace once per org, and only if:
        // - User and org are loaded
        // - User exists
        // - Org exists
        // - Not currently creating
        // - Haven't attempted to create for this org yet
        // - Workspaces list is empty
        const shouldCreateWorkspace = isLoaded && orgsLoaded && user && org && workspaces.length === 0 && !isCreatingWorkspace && !hasAttemptedOrgCreation;
        
        if (shouldCreateWorkspace) {
            console.log('Triggering workspace creation for org:', org);
            setHasAttemptedOrgCreation(true); // Mark as attempted IMMEDIATELY to prevent re-triggering
            createWorkspaceFromOrganization(org);
        }
    }, [isLoaded, orgsLoaded, user, workspaces.length, isCreatingWorkspace, hasAttemptedOrgCreation, userMemberships, createWorkspaceFromOrganization])

    const createWorkspaceFromOrganization = useCallback(async (org) => {
        if (!org) {
            console.warn('No organization provided to createWorkspaceFromOrganization');
            return;
        }
        
        // Prevent duplicate creation attempts
        if (isCreatingWorkspace) {
            console.warn('Workspace creation already in progress');
            return;
        }
        
        let safetyTimeout;
        try {
            console.log('Starting workspace creation for org:', org);
            setIsCreatingWorkspace(true);
            setCreationError(null);
            
            safetyTimeout = setTimeout(() => {
                console.warn('Workspace creation timeout exceeded');
                setCreationError("Request timed out. Please try again.");
                setIsCreatingWorkspace(false);
            }, 30000);
            
            const token = await getToken();
            console.log('Got auth token:', !!token);
            
            if (!token) {
                throw new Error("Not authenticated. Please sign in again.");
            }
            
            // Validate org data
            if (!org.id || !org.name) {
                throw new Error("Organization missing required fields (id or name)");
            }
            
            // Create workspace on backend
            console.log('Sending workspace creation request:', {
                id: org.id,
                name: org.name,
                slug: org.slug,
                hasDescription: !!org.description,
                hasImageUrl: !!org.imageUrl
            });
            
            const { data } = await api.post("/api/workspaces", {
                id: org.id,
                name: org.name,
                slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-'),
                description: org.description || "",
                image_url: org.imageUrl || ""
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Workspace created successfully:", data);
            
            // Set as active organization
            if (setActive) {
                try {
                    await setActive({ organization: org.id });
                    console.log('Activated organization:', org.id);
                } catch (activateError) {
                    console.warn('Could not activate organization, but workspace was created:', activateError);
                }
            }

            // Fetch workspaces to update Redux state
            console.log('Fetching workspaces to refresh state...');
            const result = await dispatch(fetchWorkspaces({ getToken }));
            console.log('Workspaces refreshed, result:', result?.payload?.length || 0, 'workspaces');
            
            // Clear error and mark creation as complete
            setCreationError(null);
            setIsCreatingWorkspace(false);
            
        } catch (error) {
            console.error("Error creating workspace:", {
                message: error.message,
                response: error?.response?.data,
                status: error?.response?.status,
                fullError: error
            });
            setCreationError(error?.response?.data?.message || error.message || "Failed to create workspace");
            setIsCreatingWorkspace(false);
        } finally {
            if (safetyTimeout) {
                clearTimeout(safetyTimeout);
            }
        }
    }, [isCreatingWorkspace, setActive, getToken, dispatch]);

    if(!user){
        return(
            <div className='flex justify-center items-center h-screen bg-white dark:bg-zinc-950'>
             <SignIn />
            </div>
        )
    }

    // Show loading only if currently creating a workspace
    if (isCreatingWorkspace) {
        return (
            <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
                <div className='text-center'>
                    <Loader2Icon className="size-7 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className='text-gray-600 dark:text-gray-400'>Creating your workspace...</p>
                </div>
            </div>
        )
    }

    // Show create org form only if:
    // - User exists
    // - Workspaces list is truly empty
    // - We've attempted to create (or user needs to create org)
    if (user && workspaces.length === 0 && hasAttemptedOrgCreation) {
        return (
            <div className='min-h-screen flex justify-center items-center bg-white dark:bg-zinc-950 p-4'>
                <div className='w-full max-w-2xl'>
                    {creationError && (
                        <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3'>
                            <AlertCircle className='w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5' />
                            <div>
                                <p className='text-sm font-medium text-red-800 dark:text-red-300'>Failed to create workspace</p>
                                <p className='text-sm text-red-700 dark:text-red-400 mt-1'>{creationError}</p>
                                <button
                                    onClick={() => {
                                        setCreationError(null);
                                        setHasAttemptedOrgCreation(false);
                                        setIsCreatingWorkspace(false);
                                    }}
                                    className='mt-2 text-sm text-red-600 dark:text-red-400 hover:underline'
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}
                    <div className='bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-200 dark:border-zinc-800'>
                        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Create Your Workspace</h2>
                        <p className='text-gray-600 dark:text-gray-400 mb-6'>Get started by creating your first workspace. You can invite team members after creation.</p>
                        <div className='[&_.cl-card]:bg-transparent [&_.cl-card]:shadow-none [&_.cl-card]:border-0 [&_.cl-formButtonPrimary]:bg-blue-600 [&_.cl-formButtonPrimary]:hover:bg-blue-700'>
                            <CreateOrganization afterCreateOrganizationUrl="/" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col h-screen">
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Layout
