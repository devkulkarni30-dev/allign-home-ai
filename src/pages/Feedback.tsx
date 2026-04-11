import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Send, MessageSquare, ThumbsUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import { User } from '../types';

interface FeedbackProps {
  user: User | null;
  onLogout: () => void;
}

const Feedback: React.FC<FeedbackProps> = ({ user, onLogout }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState('General');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }
    if (!comment.trim()) {
      setError('Please provide a comment');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          category,
          comment,
          name: user?.name || 'Guest',
          email: user?.email || 'guest@example.com'
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (err) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['General', 'Bug Report', 'Feature Request', 'UI/UX', 'Vastu Accuracy'];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">
              Share Your <span className="text-emerald-500">Feedback</span>
            </h1>
            <p className="text-slate-400">
              Your insights help us build the most accurate AI Vastu companion.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
          >
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Thank You!</h2>
                <p className="text-slate-400 mb-8">
                  Your feedback has been received. We appreciate you taking the time to help us improve.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-8 py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-emerald-400 transition-all"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Rating */}
                <div className="space-y-4 text-center">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest">
                    Overall Experience
                  </label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="p-2 transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={`w-10 h-10 ${
                            (hoveredRating || rating) >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          category === cat
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest">
                    Your Thoughts
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you like or what we can improve..."
                    className="w-full h-40 bg-slate-950 border border-white/10 rounded-2xl p-6 text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl shadow-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="bg-slate-900/30 p-6 rounded-3xl border border-white/5 text-center">
              <ThumbsUp className="w-6 h-6 text-emerald-500 mx-auto mb-3" />
              <div className="text-xl font-bold text-white">98%</div>
              <div className="text-[10px] text-slate-500 uppercase font-black">Satisfaction</div>
            </div>
            <div className="bg-slate-900/30 p-6 rounded-3xl border border-white/5 text-center">
              <MessageSquare className="w-6 h-6 text-blue-500 mx-auto mb-3" />
              <div className="text-xl font-bold text-white">24h</div>
              <div className="text-[10px] text-slate-500 uppercase font-black">Response Time</div>
            </div>
            <div className="bg-slate-900/30 p-6 rounded-3xl border border-white/5 text-center">
              <Star className="fill-amber-400 text-amber-400 w-6 h-6 mx-auto mb-3" />
              <div className="text-xl font-bold text-white">4.9</div>
              <div className="text-[10px] text-slate-500 uppercase font-black">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Feedback;
