import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button.jsx';
import * as articleService from '@/services/ArticleService';

const COLOR_OPTIONS = [
  { value: 'bg-pink-500', label: 'Pink' },
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-yellow-400', label: 'Yellow' },
  { value: 'bg-purple-600', label: 'Purple' },
  { value: 'bg-indigo-800', label: 'Indigo' },
  { value: 'bg-green-600', label: 'Green' },
  { value: 'bg-orange-600', label: 'Orange' },
  { value: 'bg-cyan-400', label: 'Cyan' },
  { value: 'bg-zinc-500', label: 'Zinc' }
];

const ArticlePost = ({ isOpen, onClose, onRefresh }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('bg-zinc-500'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Controls localized state machine screen views: 'edit' or 'confirm'
  const [formStep, setFormStep] = useState('edit');

  if (!isOpen) return null;

  // Retrieve tokens and database identifiers
  const activeToken = localStorage.getItem('token');
  const activeUserId = localStorage.getItem('id'); 
  
  // Safe parsing loop for localized identity objects
  const rawUserData = localStorage.getItem('user');
  let activeUsername = '';

  if (rawUserData) {
    try {
      if (rawUserData.trim().startsWith('{')) {
        const parsed = JSON.parse(rawUserData);
        activeUsername = parsed.username || '';
      } else {
        activeUsername = rawUserData;
      }
    } catch (e) {
      console.error("Identity extraction failure:", e);
      activeUsername = rawUserData;
    }
  }

  const isLoggedIn = !!(activeToken && activeUserId && activeUsername);

  // Initial validation checks before loading the confirmation terminal
  const handlePreSubmitValidation = (e) => {
    e.preventDefault();
    if (!title || !content) {
      setError('Title and Content updates are mandatory operational parameters.');
      return;
    }
    setError('');
    setFormStep('confirm');
  };

  // Finalized data transmission execution path
  const handleFinalSubmit = async () => {
    // CRITICAL: Hard lock guard preventing network interface duplication
    if (loading) return; 

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('desc', desc);
      formData.append('content', content);
      formData.append('userId', activeUserId);
      formData.append('author', activeUsername);
      formData.append('status', 'active');
      formData.append('color', color); 

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imageUrl) {
        formData.append('image', imageUrl);
      }

      await articleService.createArticle(formData);
      
      // Complete state clearance reset
      setTitle('');
      setDesc('');
      setContent('');
      setImageFile(null);
      setImageUrl('');
      setColor('bg-zinc-500');
      setFormStep('edit');
      
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Mainframe interface submission failure.');
      // Drop back to edit layout if a transmission exception occurs
      setFormStep('edit');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToLogin = () => {
    onClose();
    navigate('/auth/signin');
  };

  const handleCancelClose = () => {
    setFormStep('edit');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-sans p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg border-4 border-zinc-950 bg-zinc-900 text-white rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Block */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-2">
          <h3 className="text-xl font-black uppercase italic tracking-tight text-yellow-400">
            {!isLoggedIn ? '🔒 Access Denied' : formStep === 'confirm' ? '⚠️ Final Verification' : '📡 Create New Post'}
          </h3>
          <button 
            onClick={handleCancelClose} 
            className="text-zinc-500 hover:text-white font-black text-sm uppercase tracking-widest transition-colors"
          >
            [ESC]
          </button>
        </div>

        {!isLoggedIn ? (
          <div className="flex flex-col items-center text-center py-6 gap-6">
            <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-red-950 border-2 border-red-500 text-3xl shadow-inner animate-pulse">🚫</div>
            <div className="flex flex-col gap-2">
              <h4 className="text-lg font-bold uppercase tracking-tight text-zinc-200">Unauthenticated User</h4>
              <p className="text-zinc-400 text-xs max-w-xs leading-relaxed">
                Log In to Post an Article. Anonymous article postings are strictly prohibited on this regional network frequency.
              </p>
            </div>
            <Button type="button" onClick={handleRedirectToLogin} variant="primary" size="md" className="w-full mt-2 bg-yellow-400 text-zinc-950 border-zinc-950 hover:bg-yellow-500 font-black uppercase tracking-wider">
              Sign In to RotomPC
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-950 border border-red-500 text-red-200 text-xs px-3 py-2 rounded-lg font-bold">
                ⚠️ {error}
              </div>
            )}

            {formStep === 'confirm' ? (
              /* --- CONFIRMATION SUB-SCREEN --- */
              <div className="flex flex-col gap-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="rounded-xl border-2 border-dashed border-yellow-400/50 bg-yellow-500/5 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-black text-yellow-400 uppercase tracking-widest">
                    <span className="animate-ping h-2 w-2 rounded-full bg-yellow-400 inline-block mr-1" />
                    Review Terminal Payload
                  </div>
                  
                  <div className="flex flex-col gap-1 border-l-2 border-zinc-700 pl-3">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold">Data Title</span>
                    <p className="text-sm font-black text-white italic uppercase">{title}</p>
                  </div>

                  {desc && (
                    <div className="flex flex-col gap-1 border-l-2 border-zinc-700 pl-3">
                      <span className="text-[10px] uppercase text-zinc-500 font-bold">Subtitle Metadata</span>
                      <p className="text-xs text-zinc-300 font-medium">{desc}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-1 border-l-2 border-zinc-700 pl-3">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold">Color ID Signature</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`h-3 w-3 rounded-full ${color} border border-white/20`} />
                      <span className="text-xs font-mono uppercase text-zinc-400">{color}</span>
                    </div>
                  </div>
                </div>

                <p className="text-zinc-400 text-xs leading-relaxed px-1">
                  Confirm global transmission to the main terminal network. Once written to the system grid, logs cannot be instantly un-sent.
                </p>

                {/* Secure Interaction Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 mt-2">
                  <Button 
                    type="button" 
                    onClick={() => setFormStep('edit')} 
                    variant="secondary" 
                    size="sm"
                    disabled={loading}
                  >
                    BACK TO EDIT
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleFinalSubmit} 
                    variant="primary" 
                    size="sm" 
                    disabled={loading}
                    className="bg-yellow-400 text-zinc-950 border-zinc-950 hover:bg-yellow-500 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {loading ? 'BROADCASTING...' : 'CONFIRM & TRANSMIT'}
                  </Button>
                </div>
              </div>
            ) : (
              /* --- STANDARD EDIT FORM --- */
              <form onSubmit={handlePreSubmitValidation} className="flex flex-col gap-3">
                {/* Title Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Post Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Snorlax Blockade Route 11" className="bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-yellow-400" />
                </div>

                {/* Subtitle Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Brief Subtitle Descriptor</label>
                  <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Summary data logs..." className="bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-yellow-400" />
                </div>

                {/* Content Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Post Content</label>
                  <textarea rows="3" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter narrative fields here..." className="bg-zinc-950 border-2 border-zinc-800 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-yellow-400 resize-none" />
                </div>

                {/* Color Selection Matrix Grid */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    Article Color Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setColor(opt.value)}
                        className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold rounded-lg border-2 transition-all ${
                          color === opt.value 
                            ? 'border-yellow-400 scale-102 bg-zinc-800 text-white shadow-[2px_2px_0px_0px_rgba(250,204,21,1)]' 
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${opt.value} border border-white/20 shrink-0`} />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Graphic Source Fields */}
                <div className="border-t border-zinc-800 pt-2 flex flex-col gap-2">
                  <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Attachment Graphic Source</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold">Upload Binary Asset</span>
                      <input type="file" accept="image/*" onChange={(e) => { setImageFile(e.target.files[0]); setImageUrl(''); }} className="text-[10px] text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-black file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold">External Web Address URL</span>
                      <input type="text" value={imageUrl} disabled={!!imageFile} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/sprite.png" className="bg-zinc-950 border-2 border-zinc-800 rounded-lg p-1 text-[10px] font-bold text-white focus:outline-none focus:border-yellow-400 disabled:opacity-40" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800 mt-2">
                  <Button type="button" onClick={handleCancelClose} variant="secondary" size="sm">CANCEL</Button>
                  <Button type="submit" variant="primary" size="sm">
                    REVIEW ENTRY
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ArticlePost;