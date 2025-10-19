// Dashboard - Canvas management dashboard

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCanvasManagement } from '../../contexts/CanvasManagementContext';
import Navbar from '../Layout/Navbar';
import CanvasCard from './CanvasCard';
import CreateCanvasDialog from './CreateCanvasDialog';
import JoinCanvasDialog from './JoinCanvasDialog';
import ShareCodeDialog from './ShareCodeDialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    userCanvases,
    sharedCanvases,
    isLoadingCanvases,
    createCanvas,
    deleteCanvas,
    joinCanvas,
  } = useCanvasManagement();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [shareDialogCanvas, setShareDialogCanvas] = useState(null);
  
  const handleCreateCanvas = async (name) => {
    try {
      const newCanvas = await createCanvas(name);
      setIsCreateDialogOpen(false);
      // Navigate to the new canvas
      navigate(`/canvas/${newCanvas.id}`);
    } catch (error) {
      console.error('Error creating canvas:', error);
      alert('Failed to create canvas. Please try again.');
    }
  };
  
  const handleOpenCanvas = (canvasId) => {
    navigate(`/canvas/${canvasId}`);
  };
  
  const handleDeleteCanvas = async (canvasId) => {
    if (!window.confirm('Are you sure you want to delete this canvas? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteCanvas(canvasId);
    } catch (error) {
      console.error('Error deleting canvas:', error);
      alert('Failed to delete canvas. Please try again.');
    }
  };
  
  const handleJoinCanvas = async (shareCode) => {
    try {
      const canvas = await joinCanvas(shareCode);
      setIsJoinDialogOpen(false);
      // Navigate to the joined canvas
      navigate(`/canvas/${canvas.id}`);
    } catch (error) {
      console.error('Error joining canvas:', error);
      throw error; // Let the dialog handle the error display
    }
  };
  
  if (isLoadingCanvases) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your canvases...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content - Aligned with Navbar */}
      <main className="px-8 py-8 max-w-[1500px]">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Canvas
          </button>
          
          <button
            onClick={() => setIsJoinDialogOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg border-2 border-gray-300 hover:border-blue-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Join Canvas
          </button>
        </div>
        
        {/* My Canvases Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Canvases</h2>
          {userCanvases.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No canvases yet</h3>
              <p className="text-gray-600 mb-4">Create your first canvas to get started</p>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Canvas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {userCanvases.map((canvas) => (
                <CanvasCard
                  key={canvas.canvasId}
                  canvas={canvas}
                  isOwner={true}
                  onOpen={() => handleOpenCanvas(canvas.canvasId)}
                  onDelete={() => handleDeleteCanvas(canvas.canvasId)}
                  onShare={() => setShareDialogCanvas(canvas)}
                />
              ))}
            </div>
          )}
        </section>
        
        {/* Shared With Me Section */}
        {sharedCanvases.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shared With Me</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sharedCanvases.map((canvas) => (
                <CanvasCard
                  key={canvas.canvasId}
                  canvas={canvas}
                  isOwner={false}
                  onOpen={() => handleOpenCanvas(canvas.canvasId)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      
      {/* Dialogs */}
      <CreateCanvasDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={handleCreateCanvas}
      />
      
      <JoinCanvasDialog
        isOpen={isJoinDialogOpen}
        onClose={() => setIsJoinDialogOpen(false)}
        onJoin={handleJoinCanvas}
      />
      
      {shareDialogCanvas && (
        <ShareCodeDialog
          canvas={shareDialogCanvas}
          onClose={() => setShareDialogCanvas(null)}
        />
      )}
    </div>
  );
}

