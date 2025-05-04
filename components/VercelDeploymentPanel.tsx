'use client';

import { useState } from 'react';
import useVercelSDK from '../lib/vercel/use-vercel-sdk';

interface DeploymentPanelProps {
  token: string;
  teamId?: string;
  projectId: string;
}

export default function VercelDeploymentPanel({ token, teamId, projectId }: DeploymentPanelProps) {
  const [deploymentName, setDeploymentName] = useState('');
  const [deploymentTarget, setDeploymentTarget] = useState<'production' | 'preview'>('preview');
  const [deploymentStatus, setDeploymentStatus] = useState<string>('');
  const [deploymentUrl, setDeploymentUrl] = useState<string>('');
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    createDeployment,
    pollDeploymentStatus,
    cancelDeployment,
    getDeploymentLogs,
    promoteToProduction
  } = useVercelSDK(token, teamId);

  const handleDeploy = async () => {
    setIsLoading(true);
    setError(null);
    setDeploymentStatus('Initiating deployment...');
    
    try {
      // Create the deployment
      const deployment = await createDeployment(projectId, {
        name: deploymentName || `deployment-${new Date().toISOString()}`,
        target: deploymentTarget
      });
      
      setDeploymentStatus(`Deployment created with ID: ${deployment.id}`);
      setDeploymentUrl(deployment.url || '');
      
      // Poll for deployment status
      try {
        const status = await pollDeploymentStatus(deployment.id);
        setDeploymentStatus(`Deployment successful: ${status}`);
        
        // Get logs after deployment
        const logs = await getDeploymentLogs(deployment.id);
        setDeploymentLogs(logs.logs?.map(log => log.text) || []);
      } catch (error) {
        setDeploymentStatus('Deployment failed');
        setError((error as Error).message);
      }
    } catch (error) {
      setError((error as Error).message);
      setDeploymentStatus('Error creating deployment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!deploymentUrl) {
      setError('No active deployment to cancel');
      return;
    }
    
    setIsLoading(true);
    try {
      // Extract the deployment ID from the deployment URL if stored, or from state
      const deploymentId = deploymentUrl.split('https://')[1]?.split('.')[0] || '';
      
      if (!deploymentId) {
        throw new Error('No deployment ID found');
      }
      
      await cancelDeployment(deploymentId);
      setDeploymentStatus('Deployment canceled');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!deploymentUrl) {
      setError('No deployment to promote');
      return;
    }
    
    setIsLoading(true);
    try {
      // Extract the deployment ID from the deployment URL
      const deploymentId = deploymentUrl.split('https://')[1]?.split('.')[0] || '';
      
      if (!deploymentId) {
        throw new Error('No deployment ID found');
      }
      
      await promoteToProduction(deploymentId, projectId);
      setDeploymentStatus('Deployment promoted to production');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Vercel Deployment Panel</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deployment Name
        </label>
        <input
          type="text"
          value={deploymentName}
          onChange={(e) => setDeploymentName(e.target.value)}
          placeholder="my-awesome-deployment"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deployment Target
        </label>
        <select
          value={deploymentTarget}
          onChange={(e) => setDeploymentTarget(e.target.value as 'production' | 'preview')}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="preview">Preview</option>
          <option value="production">Production</option>
        </select>
      </div>
      
      <div className="flex space-x-3 mb-6">
        <button
          onClick={handleDeploy}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        >
          {isLoading ? 'Deploying...' : 'Deploy'}
        </button>
        
        <button
          onClick={handleCancel}
          disabled={isLoading || !deploymentUrl}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
        >
          Cancel
        </button>
        
        <button
          onClick={handlePromote}
          disabled={isLoading || !deploymentUrl || deploymentTarget === 'production'}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          Promote
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {deploymentStatus && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Status</h3>
          <div className="p-3 bg-gray-100 border border-gray-300 rounded-md">
            {deploymentStatus}
          </div>
        </div>
      )}
      
      {deploymentUrl && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Deployment URL</h3>
          <div className="p-3 bg-gray-100 border border-gray-300 rounded-md">
            <a 
              href={`https://${deploymentUrl}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {deploymentUrl}
            </a>
          </div>
        </div>
      )}
      
      {deploymentLogs.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Deployment Logs</h3>
          <div className="p-3 bg-black text-green-400 rounded-md font-mono text-sm h-64 overflow-y-auto">
            {deploymentLogs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}