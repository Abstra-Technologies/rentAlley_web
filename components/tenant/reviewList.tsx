import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const LandlordFeedbackForm = ({ review_id, landlord_id, onFeedbackSubmit }) => {
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setError("Feedback cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reviews/submitFeedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landlord_id,
          review_id,
          feedback_text: feedbackText,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        onFeedbackSubmit(data);
        setFeedbackText("");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to submit feedback.");
    }

    setLoading(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        Response from host
      </h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm resize-none"
          rows={3}
          placeholder="Write your response..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit response"}
        </button>
      </form>
    </div>
  );
};

const ReviewsList = ({ unit_id, landlord_id }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReview, setExpandedReview] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/getReviews?unit_id=${unit_id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setError("Unable to load reviews. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [unit_id]);

  const handleFeedbackSubmit = async () => {
    await fetchReviews();
  };

  const toggleExpandReview = (reviewId) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
    }).format(date);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`;
  };

  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={
              i < rating ? "fill-gray-900 text-gray-900" : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No reviews yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Be the first to leave a review
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const isExpanded = expandedReview === review.id;
        const truncated = review.review_text?.length > 200 && !isExpanded;

        return (
          <div
            key={review.id}
            className="pb-6 border-b border-gray-200 last:border-b-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-900 text-white font-semibold flex items-center justify-center rounded-full flex-shrink-0">
                  {getInitials(
                    review.tenant_first_name,
                    review.tenant_last_name
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {review.tenant_first_name} {review.tenant_last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(review.created_at)}
                  </p>
                </div>
              </div>
              {renderStarRating(review.rating)}
            </div>

            <div className="text-gray-700 text-sm leading-relaxed">
              <p>
                {truncated
                  ? `${review.review_text.substring(0, 200)}...`
                  : review.review_text}
              </p>

              {review.review_text?.length > 200 && (
                <button
                  onClick={() => toggleExpandReview(review.id)}
                  className="font-medium text-gray-900 underline hover:no-underline mt-2 text-sm"
                >
                  {isExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>

            {review.feedback_text && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Response from host
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {review.feedback_text}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  {review.landlord_first_name} {review.landlord_last_name}
                  {review.feedback_date && (
                    <span className="ml-2">
                      · {formatDate(review.feedback_date)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {!review.feedback_text && landlord_id && (
              <LandlordFeedbackForm
                review_id={review.id}
                landlord_id={landlord_id}
                onFeedbackSubmit={handleFeedbackSubmit}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReviewsList;
