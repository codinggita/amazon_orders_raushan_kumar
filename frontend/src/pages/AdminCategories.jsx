import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tags, Plus, Edit, Trash2, X, Sparkles, HelpCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const AdminCategories = () => {
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [mainHierarchy, setMainHierarchy] = useState('');

  // Fetch Category taxonomy
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data?.data || [];
    }
  });

  // Re-parent mutation
  const reParentMutation = useMutation({
    mutationFn: async ({ categoryId, mainParent }) => {
      const res = await api.patch(`/categories/${categoryId}`, {
        hierarchy: { main: mainParent }
      });
      return res.data?.data;
    },
    onSuccess: (updated) => {
      addToast(`Re-parented category: ${updated.name} Snapped under ${updated.hierarchy.main}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to re-parent category node.', 'error');
    }
  });

  // Create Category Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/categories', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      addToast('Taxonomy division branch added successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to add category branch.', 'error');
    }
  });

  // Delete Category Mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId) => {
      await api.delete(`/categories/${categoryId}`);
    },
    onSuccess: () => {
      addToast('Category division deleted successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete category.', 'error');
    }
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setMainHierarchy('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !mainHierarchy) {
      addToast('Category Name and Hierarchy main division are required.', 'warning');
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const payload = {
      name,
      slug,
      hierarchy: {
        main: mainHierarchy,
        sub: name
      }
    };

    createMutation.mutate(payload);
  };

  // Node DAG representation
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Compile Categories into nodes and links (Directed Acyclic Graph)
  useEffect(() => {
    if (!categories || categories.length === 0) return;

    // Identify parent sets and node lists
    const uniqueParents = [...new Set(categories.map(c => c.hierarchy.main))];
    const generatedNodes = [];
    const generatedLinks = [];

    // Parent Core nodes
    uniqueParents.forEach((parent, idx) => {
      const angle = (idx / uniqueParents.length) * Math.PI * 2;
      generatedNodes.push({
        id: `parent_${parent}`,
        label: parent,
        x: 250 + Math.cos(angle) * 110,
        y: 160 + Math.sin(angle) * 80,
        r: 25,
        isParent: true,
        fill: '#3b82f6'
      });
    });

    // Sub-category leaf nodes
    categories.forEach((cat, idx) => {
      const parentId = `parent_${cat.hierarchy.main}`;
      const parentNode = generatedNodes.find(n => n.id === parentId);
      const angle = (idx / categories.length) * Math.PI * 2 + Math.random();

      const px = parentNode ? parentNode.x : 250;
      const py = parentNode ? parentNode.y : 160;

      generatedNodes.push({
        id: cat.categoryId,
        label: cat.name,
        x: px + Math.cos(angle) * 45,
        y: py + Math.sin(angle) * 45,
        r: 16,
        isParent: false,
        categoryId: cat.categoryId,
        parentName: cat.hierarchy.main,
        fill: '#10b981'
      });

      generatedLinks.push({
        source: cat.categoryId,
        target: parentId
      });
    });

    setNodes(generatedNodes);
    setLinks(generatedLinks);
  }, [categories]);

  // Directed Graph animation loop inside canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const renderGraph = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connection wires with Bézier curves
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        
        // Curve control point
        const ctrlX = (sourceNode.x + targetNode.x) / 2;
        const ctrlY = (sourceNode.y + targetNode.y) / 2 - 20;

        ctx.quadraticCurveTo(ctrlX, ctrlY, targetNode.x, targetNode.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw active temporary drag snaps (Bézier curves)
      if (draggedNode && !draggedNode.isParent) {
        // Find closest parent node
        const parents = nodes.filter(n => n.isParent);
        let closestParent = null;
        let minDist = 99999;
        parents.forEach(p => {
          const dx = p.x - draggedNode.x;
          const dy = p.y - draggedNode.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < minDist) {
            minDist = dist;
            closestParent = p;
          }
        });

        if (closestParent && minDist < 120) {
          ctx.beginPath();
          ctx.moveTo(draggedNode.x, draggedNode.y);
          ctx.quadraticCurveTo((draggedNode.x + closestParent.x)/2, (draggedNode.y + closestParent.y)/2 - 30, closestParent.x, closestParent.y);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]); // Reset
          
          // Draw snap indicator ring
          ctx.beginPath();
          ctx.arc(closestParent.x, closestParent.y, closestParent.r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Draw Nodes
      nodes.forEach(node => {
        // Adjust radii to make nodes larger and easier to read/drag
        const adjustedRadius = node.isParent ? 38 : 28;

        // Render drop-shadow glow behind text boundary circles
        ctx.beginPath();
        ctx.arc(node.x, node.y, adjustedRadius, 0, Math.PI * 2);
        ctx.fillStyle = node.isParent ? '#1e3a8a' : '#064e3b'; // Sleek dark slate fills for high contrast text backgrounds
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, adjustedRadius, 0, Math.PI * 2);
        ctx.fillStyle = node.fill;
        ctx.shadowColor = node.fill;
        ctx.shadowBlur = draggedNode?.id === node.id ? 20 : 8;
        ctx.globalAlpha = 0.85; // transparent overlay for visibility
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0; // Reset

        // Border outline
        ctx.strokeStyle = node.isParent ? '#60a5fa' : '#34d399';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node label - increased font size and black background offsets
        ctx.fillStyle = '#ffffff';
        ctx.font = node.isParent ? 'bold 11px sans-serif' : '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(node.label, node.x, node.y + (node.isParent ? 4 : 3));
        ctx.shadowBlur = 0; // Reset
      });

      animationId = requestAnimationFrame(renderGraph);
    };

    renderGraph();
    return () => cancelAnimationFrame(animationId);
  }, [nodes, links, draggedNode]);

  // Handle Drag events in Directed Acyclic Graph Canvas
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check hit test against nodes (using the adjusted radius)
    const hit = nodes.find(n => {
      const dx = n.x - mx;
      const dy = n.y - my;
      const radius = n.isParent ? 38 : 28;
      return Math.sqrt(dx*dx + dy*dy) < radius;
    });

    if (hit) {
      setDraggedNode(hit);
      setDragOffset({ x: hit.x - mx, y: hit.y - my });
    }
  };

  const handleMouseMove = (e) => {
    if (!draggedNode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setNodes(prev => prev.map(n => 
      n.id === draggedNode.id ? { ...n, x: mx + dragOffset.x, y: my + dragOffset.y } : n
    ));
  };

  const handleMouseUp = () => {
    if (!draggedNode) return;

    // Drag-and-drop Reparenting snap evaluation
    if (!draggedNode.isParent) {
      const parents = nodes.filter(n => n.isParent);
      let closestParent = null;
      let minDist = 99999;
      parents.forEach(p => {
        const dx = p.x - draggedNode.x;
        const dy = p.y - draggedNode.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDist) {
          minDist = dist;
          closestParent = p;
        }
      });

      // Snapped to closest parent
      if (closestParent && minDist < 120) {
        const newParentName = closestParent.label;
        if (newParentName !== draggedNode.parentName) {
          reParentMutation.mutate({
            categoryId: draggedNode.categoryId,
            mainParent: newParentName
          });
        }
      }
    }

    setDraggedNode(null);
  };

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 py-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] text-primary font-bold uppercase tracking-wider w-max">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Force-Directed Graph UI</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Taxonomy Divisions</h1>
          <p className="text-slate-400 text-xs">Visualize category networks. Drag sub-nodes to reparent hierarchy snapping.</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white font-bold text-xs py-3.5 px-5 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Directed Acyclic Graph Canvas Block */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 hover:border-slate-800 transition-colors">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
              <Tags className="w-4 h-4 text-emerald-400" /> Interactive Directed Taxonomy Map
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Snapping active</span>
          </div>

          <div className="w-full bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center p-2 relative">
            <canvas 
              ref={canvasRef} 
              width={500} 
              height={320} 
              className="w-full max-w-[500px] h-[320px] block cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            
            <div className="absolute bottom-4 left-4 bg-slate-900 border border-white/5 px-3 py-1.5 rounded-xl flex gap-3 text-[9px] text-slate-400 font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Parent Nodes</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sub Categories</span>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex gap-3.5 items-start text-xs text-slate-400">
            <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Drag sub-categories closer to another parent node (blue circle). When they enter the snapping threshold, the system draws a <span className="text-amber-400 font-bold">temporary orange Bézier curve</span>. Release to trigger the reparenting database updates.
            </p>
          </div>
        </div>

        {/* Categories List grid */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 hover:border-slate-800 transition-colors">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-white font-extrabold text-xs uppercase tracking-wider">Hierarchy List</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Record count: {categories?.length || 0}</span>
          </div>

          {isLoading ? (
            <div className="flex-grow flex flex-col items-center justify-center py-10 gap-4">
              <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
              {categories && categories.map((cat) => (
                <div key={cat.categoryId} className="bg-slate-950/80 border border-white/5 p-3 rounded-2xl flex items-center justify-between hover:border-slate-800 transition-all hover:translate-x-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white font-bold text-xs">{cat.name}</span>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Parent: {cat.hierarchy.main}</span>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(cat.categoryId)}
                    className="p-1.5 bg-rose-950/20 hover:bg-rose-950/30 rounded-lg text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-6 relative shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-white font-extrabold text-lg">Add Taxonomy Branch</h2>
              <p className="text-slate-500 text-xs mt-0.5">Build new routing logic categories.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-slate-400">Category Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smart Watches"
                  className="bg-slate-950 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary/50"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-slate-400">Parent Main Division</label>
                <select
                  value={mainHierarchy}
                  onChange={(e) => setMainHierarchy(e.target.value)}
                  required
                  className="bg-slate-950 border border-white/5 p-3 rounded-xl text-white outline-none"
                >
                  <option value="">Select Parent Division</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-xl text-xs transition-all mt-2"
              >
                Commit Branch
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
