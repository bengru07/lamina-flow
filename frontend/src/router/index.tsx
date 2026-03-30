import RootLayout from '@/layout/RootLayout';
import HomePage from '@/pages/home';
import WorkspacesPage from '@/pages/workspaces';
import WorkspaceDetailsPage from '@/pages/workspace-details';
import WorkspaceSettingsPage from '@/pages/workspace-settings';
import ManifestsPage from '@/pages/manifests';
import ManifestDetailPage from '@/pages/manifest-details';
import DeploymentsPage from '@/pages/deployments';
import DeploymentDetailPage from '@/pages/deployment-details';
import SettingsPage from '@/pages/settings';
import NotFoundPage from '@/pages/not-found';
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'workspaces',
        children: [
          {
            index: true,
            element: <WorkspacesPage />,
          },
          {
            path: ':workspaceId',
            element: <WorkspaceDetailsPage />,
          },
          {
            path: ':workspaceId/settings',
            element: <WorkspaceSettingsPage />,
          },
        ],
      },
      {
        path: 'manifests',
        children: [
          {
            index: true,
            element: <ManifestsPage />,
          },
          {
            path: ':manifestId',
            element: <ManifestDetailPage />,
          },
        ],
      },
      {
        path: 'deployments',
        children: [
          {
            index: true,
            element: <DeploymentsPage />,
          },
          {
            path: ':deploymentId',
            element: <DeploymentDetailPage />,
          },
        ],
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);