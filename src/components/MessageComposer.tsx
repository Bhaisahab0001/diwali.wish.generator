import React, { useState } from 'react';
import type { VisualTheme, EnvelopeSeal } from '../types.ts';
import { ThemeSelector } from './ThemeSelector.tsx';
import { Envelope3D } from './Envelope3D.tsx';
import { ParchmentLetter } from './ParchmentLetter.tsx';
import {
  Sparkles,
  Lock,
  Dices,
  Image as ImageIcon,
  Trash2,
  Eye,
  Flame,
  Clock,
  ArrowRight,
  Check,
  Send,
  HelpCircle,
} from 'lucide-react';

interface MessageComposerProps {
  initialData?: {
    id?: string;
    recipient_name?: string;
    sender_name?: string;
    title?: string;
    content?: string;
    password_hint?: string | null;
    theme?: VisualTheme;
    envelope_seal?: EnvelopeSeal;
    burn_after_reading?: boolean;
    max_views?: number | null;
    image?: { data_base64: string; mime_type: string; file_name: string | null } | null;
  };
  onSave: (payload: any) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
}

const EMOJI_LIST = ['💌', '💖', '🪔', '✨', '🌹', '🌙', '🕯️', '🥂', '🕊️', '⭐', '🎁', '💫', '🌸', '🪄'];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  initialData,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  const [recipientName, setRecipientName] = useState(initialData?.recipient_name || '');
  const [senderName, setSenderName] = useState(initialData?.sender_name || '');
  const [title, setTitle] = useState(initialData?.title || 'A Secret Note For You');
  const [content, setContent] = useState(initialData?.content || '');
  const [password, setPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState(initialData?.password_hint || '');
  const [theme, setTheme] = useState<VisualTheme>(initialData?.theme || 'midnight-starlight');
  const [seal, setSeal] = useState<EnvelopeSeal>(initialData?.envelope_seal || 'heart');
  const [burnAfterReading, setBurnAfterReading] = useState(initialData?.burn_after_reading || false);
  const [expiresInHours, setExpiresInHours] = useState<number | ''>(24);
  const [maxViews, setMaxViews] = useState<number | ''>(initialData?.max_views || '');
  const [imageAttachment, setImageAttachment] = useState<{
    data_base64: string;
    mime_type: string;
    file_name: string;
  } | null>(initialData?.image ? { ...initialData.image, file_name: initialData.image.file_name || 'image' } : null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [previewMode, setPreviewMode] = useState<'envelope' | 'letter'>('envelope');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate strong random passcode
  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  // Image upload with strict validation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Only JPG, PNG, WEBP, or GIF images are allowed.');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 2.5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageAttachment({
        data_base64: base64,
        mime_type: file.type,
        file_name: file.name,
      });
      setRemoveExistingImage(false);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleInsertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!recipientName.trim()) {
      setErrorMessage('Please provide a recipient name.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Please write your secret message content.');
      return;
    }
    if (!isEditing && (!password || password.length < 4)) {
      setErrorMessage('Please set a secret passcode of at least 4 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        recipient_name: recipientName.trim(),
        sender_name: senderName.trim() || 'A Secret Admirer',
        title: title.trim() || 'A Secret Note For You',
        content,
        password_hint: passwordHint.trim() || null,
        theme,
        envelope_seal: seal,
        burn_after_reading: burnAfterReading,
        max_views: maxViews ? Number(maxViews) : null,
        expires_in_hours: expiresInHours ? Number(expiresInHours) : null,
      };

      if (!isEditing) {
        payload.password = password;
        if (imageAttachment) {
          payload.image = imageAttachment;
        }
      } else {
        if (password) {
          payload.new_password = password;
        }
        if (removeExistingImage) {
          payload.remove_image = true;
        } else if (imageAttachment) {
          payload.image = imageAttachment;
        }
      }

      await onSave(payload);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save secret message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Composer Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{isEditing ? 'Edit Secret Message' : 'Compose Secret Dispatch'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Encrypted with individual password protection and Cloudflare D1 storage
          </p>
        </div>

        {/* Tab switcher: Editor vs Live Preview */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'editor'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Composer Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs sm:text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      {/* Mode 1: Editor Form */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recipient Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Recipient Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Priyanshu, My Beloved, Maya..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>

            {/* Sender Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Sender Name (or Pseudonym)
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Krishna, A Secret Admirer..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>
          </div>

          {/* Title / Subject */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Envelope Subtitle / Hint
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Under the Diwali Starlight, Open When You Miss Me..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
            />
          </div>

          {/* Message Content with Emoji Toolbar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Secret Message Body <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">{content.length} characters</span>
            </div>

            {/* Quick Emoji Bar */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2 p-2 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Insert emoji:</span>
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleInsertEmoji(emoji)}
                  className="px-2 py-1 rounded-lg hover:bg-slate-800 text-sm transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your heartfelt, secret message here... It will be revealed only after entering the passcode."
              required
              className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm sm:text-base leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 resize-y font-sans"
            />
          </div>

          {/* Password Protection & Clue */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-purple-950/20 border border-amber-500/20 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Lock className="w-4 h-4" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Individual Password Protection
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Passcode Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-300">
                    {isEditing ? 'New Passcode (Leave blank to keep current)' : 'Secret Passcode *'}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Suggest Random</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? '••••••••' : 'e.g. moonlit2026'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Password Clue / Hint */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Password Clue for Recipient (Optional)
                </label>
                <input
                  type="text"
                  value={passwordHint}
                  onChange={(e) => setPasswordHint(e.target.value)}
                  placeholder="e.g. Our favorite stargazing spot..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Expiry & Self-Destruct Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            {/* Burn after reading */}
            <div className="flex items-start gap-3">
              <input
                id="burn"
                type="checkbox"
                checked={burnAfterReading}
                onChange={(e) => setBurnAfterReading(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700"
              />
              <label htmlFor="burn" className="cursor-pointer">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Burn After Reading
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Self-destructs immediately after recipient's first unlock
                </p>
              </label>
            </div>

            {/* Expiry duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Expiration Window
              </label>
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value={1}>1 hour</option>
                <option value={24}>24 hours (1 day)</option>
                <option value={72}>3 days</option>
                <option value={168}>7 days (1 week)</option>
                <option value={720}>30 days (1 month)</option>
                <option value="">Never (No Expiration)</option>
              </select>
            </div>

            {/* Max Views Limit */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max View Count (Optional)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))}
                placeholder="Unlimited"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Image Attachment */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Enclosed Keepsake (Image Attachment)
            </label>

            {imageAttachment ? (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <img
                  src={imageAttachment.data_base64}
                  alt="Preview"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{imageAttachment.file_name}</p>
                  <p className="text-[10px] text-slate-400">Enclosed with message</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageAttachment(null);
                    setRemoveExistingImage(true);
                  }}
                  className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-4 text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <ImageIcon className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                <p className="text-xs text-slate-300">Click to upload photo or keepsake</p>
                <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WEBP or GIF (up to 2.5MB)</p>
              </div>
            )}
          </div>

          {/* Theme & Seal Picker */}
          <ThemeSelector
            currentTheme={theme}
            onSelectTheme={setTheme}
            currentSeal={seal}
            onSelectSeal={setSeal}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 active:scale-95 disabled:opacity-50 transition-all shadow-[0_4px_16px_rgba(245,158,11,0.3)] flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Sealing Message...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create & Seal Message'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Mode 2: Live Preview */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit mx-auto">
            <button
              type="button"
              onClick={() => setPreviewMode('envelope')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                previewMode === 'envelope'
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Sealed Envelope State
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('letter')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                previewMode === 'letter'
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Unlocked Parchment State
            </button>
          </div>

          {previewMode === 'envelope' ? (
            <div className="p-4 sm:p-8 rounded-3xl bg-slate-950/60 border border-slate-800">
              <Envelope3D
                recipientName={recipientName || 'Recipient Name'}
                senderName={senderName || 'Sender Name'}
                title={title || 'A Secret Note For You'}
                theme={theme}
                seal={seal}
                passwordHint={passwordHint}
                isUnlocked={true}
                isOwnerPreview={true}
              />
            </div>
          ) : (
            <div className="p-4 sm:p-8 rounded-3xl bg-slate-950/60 border border-slate-800">
              <ParchmentLetter
                data={{
                  slug: 'preview-slug',
                  recipient_name: recipientName || 'Recipient Name',
                  sender_name: senderName || 'Sender Name',
                  title: title || 'A Secret Note For You',
                  content: content || 'Your secret letter text will appear here once unlocked with the correct password...',
                  theme,
                  envelope_seal: seal,
                  created_at: Math.floor(Date.now() / 1000),
                  view_count: 1,
                  is_burned: burnAfterReading,
                  burn_after_reading: burnAfterReading,
                  image: imageAttachment,
                }}
              />
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className="px-5 py-2 rounded-xl text-xs font-medium text-amber-300 border border-amber-400/40 hover:bg-amber-400/10 transition-colors"
            >
              Back to Form Editing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
