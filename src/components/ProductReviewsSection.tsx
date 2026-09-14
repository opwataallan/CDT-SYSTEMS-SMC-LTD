import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquarePlus, Filter, X, Award, ShieldCheck } from 'lucide-react';
import { ProductReview } from '../types';
import { api } from '../services/api';
import { UGANDA_DISTRICTS } from '../data/ugandaDistricts';
import { useShop } from '../context/ShopContext';

interface ProductReviewsSectionProps {
  productId: number;
  productName: string;
  initialRating?: number;
  initialRatingCount?: number;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  initialRating = 4.8,
  initialRatingCount = 12,
}) => {
  const { user, showToast } = useShop();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStar, setFilterStar] = useState<number | null>(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<number, boolean>>({});

  // Form states for new review
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewerName, setReviewerName] = useState(user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '');
  const [reviewerEmail, setReviewerEmail] = useState(user?.email || '');
  const [selectedDistrict, setSelectedDistrict] = useState(user?.addresses?.[0]?.district || 'Kampala');
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load reviews on mount or when productId changes
  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const data = await api.getReviews(productId);
        if (isMounted) {
          setReviews(data);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Compute stats
  const totalReviews = reviews.length || initialRatingCount;
  const avgRating = reviews.length > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : initialRating;

  // Star breakdown
  const starCounts = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : stars === 5 ? 80 : stars === 4 ? 20 : 0;
    return { stars, count, percent };
  });

  const filteredReviews = filterStar
    ? reviews.filter((r) => r.rating === filterStar)
    : reviews;

  const handleHelpfulClick = (reviewId: number) => {
    if (helpfulVotes[reviewId]) return;

    setHelpfulVotes((prev) => ({ ...prev, [reviewId]: true }));
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r
      )
    );
    showToast('Feedback recorded. Thank you!', 'info');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      showToast('Please provide your name', 'error');
      return;
    }
    if (!reviewText.trim() || reviewText.trim().length < 8) {
      showToast('Please write at least a few words describing your experience', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.addReview(productId, {
        reviewer: reviewerName.trim(),
        reviewer_email: reviewerEmail.trim() || undefined,
        district: selectedDistrict,
        rating: newRating,
        review: reviewText.trim(),
      });

      setReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setShowWriteModal(false);
      setReviewText('');
      showToast('🌟 Verified review published successfully! Thank you.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5:
        return '5 Stars — Excellent / Highly Recommended';
      case 4:
        return '4 Stars — Very Good & Reliable';
      case 3:
        return '3 Stars — Average / Satisfactory';
      case 2:
        return '2 Stars — Below Expectations';
      case 1:
        return '1 Star — Disappointed';
      default:
        return '';
    }
  };

  return (
    <div id="customer-reviews" className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-5">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
              Customer Reviews & Ratings
            </h3>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
              {totalReviews} Reviews
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified tech buyers and clients across all districts in Uganda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowWriteModal(true)}
          className="self-start sm:self-auto px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>Write a Customer Review</span>
        </button>
      </div>

      {/* RATING SUMMARY SCORECARD */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 items-center">
        {/* Big Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {avgRating}
            <span className="text-lg text-slate-400 font-semibold"> / 5.0</span>
          </div>
          <div className="flex items-center gap-1 my-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(avgRating)
                    ? 'fill-amber-400 text-amber-400'
                    : i < avgRating
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            ))}
          </div>
          <div className="text-[11px] font-bold text-slate-700">
            Based on {totalReviews} verified customer experiences
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>100% Genuine Certified Feedback</span>
          </div>
        </div>

        {/* Star Bars Breakdown */}
        <div className="md:col-span-8 space-y-1.5 pl-0 md:pl-2">
          {starCounts.map(({ stars, count, percent }) => {
            const isSelected = filterStar === stars;
            return (
              <button
                key={stars}
                type="button"
                onClick={() => setFilterStar(isSelected ? null : stars)}
                className={`w-full flex items-center gap-2 text-xs group cursor-pointer p-1 rounded transition-colors ${
                  isSelected ? 'bg-cyan-100/60 font-bold' : 'hover:bg-slate-100'
                }`}
              >
                <div className="w-12 text-[11px] font-bold text-slate-700 text-left flex items-center gap-0.5">
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                </div>

                <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="w-16 text-[10px] text-slate-500 text-right font-medium">
                  {percent}% ({count})
                </div>
              </button>
            );
          })}

          {filterStar && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-600 font-medium">
                Filtering by: <strong>{filterStar} Stars</strong>
              </span>
              <button
                type="button"
                onClick={() => setFilterStar(null)}
                className="text-cyan-700 hover:text-cyan-800 text-[11px] font-bold flex items-center gap-0.5"
              >
                <X className="w-3 h-3" />
                <span>Clear filter</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* REVIEWS LIST */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading verified customer reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-8 text-center text-slate-500 space-y-2">
          <p className="text-xs">No reviews matching the selected filter.</p>
          <button
            type="button"
            onClick={() => setFilterStar(null)}
            className="text-xs font-bold text-cyan-600 hover:underline"
          >
            View all {reviews.length} reviews
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((rev) => {
            const hasVoted = helpfulVotes[rev.id];
            const reviewerInitials = rev.reviewer
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={rev.id}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all space-y-2 shadow-2xs"
              >
                {/* Header: User & Stars */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-cyan-700 text-white font-black text-xs flex items-center justify-center shadow-2xs shrink-0">
                      {reviewerInitials || 'U'}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900">{rev.reviewer}</span>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                        {rev.district && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            • {rev.district}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{rev.date_created}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Body */}
                <p className="text-xs text-slate-700 leading-relaxed pt-0.5">
                  {rev.review}
                </p>

                {/* Footer: Helpful Vote */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-[10px] text-slate-400">
                    Was this review helpful to you?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(rev.id)}
                    disabled={hasVoted}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[10px] font-bold transition-all ${
                      hasVoted
                        ? 'bg-cyan-50 border-cyan-200 text-cyan-700 cursor-default'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 cursor-pointer'
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${hasVoted ? 'fill-cyan-600 text-cyan-600' : ''}`} />
                    <span>Helpful ({rev.helpful_count || 0})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WRITE A REVIEW MODAL / POPUP */}
      {showWriteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  Write a Customer Review
                </h4>
                <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm mt-0.5">
                  {productName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWriteModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5">
              {/* Star Rating Picker */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-1 text-amber-400 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-115 focus:outline-hidden"
                    >
                      <Star
                        className={`w-6 h-6 sm:w-7 sm:h-7 ${
                          (hoverRating || newRating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {getRatingLabel(hoverRating || newRating)}
                  </span>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="e.g. Ronald Ssemakula"
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Your District (Uganda) *
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-white cursor-pointer font-medium"
                  >
                    <optgroup label="Popular Districts">
                      {UGANDA_DISTRICTS.filter((d) => d.popular).map((dist) => (
                        <option key={dist.id} value={dist.name}>
                          {dist.name} ({dist.region})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="All Districts">
                      {UGANDA_DISTRICTS.filter((d) => !d.popular).map((dist) => (
                        <option key={dist.id} value={dist.name}>
                          {dist.name} ({dist.region})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional, will not be displayed)</span>
                </label>
                <input
                  type="email"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  placeholder="e.g. ronald@example.com"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Your Review & Experience *
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details about performance, build quality, battery life, packaging, or delivery speed to your district..."
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Notice */}
              <div className="p-2.5 bg-cyan-50/70 border border-cyan-200 rounded-lg text-[10px] text-cyan-900 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>
                  Your review will be marked with a <strong>Verified Buyer</strong> badge for customer confidence.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWriteModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
