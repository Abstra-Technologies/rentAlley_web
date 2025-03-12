import { useEffect, useState } from "react";
import LandlordFeedbackForm from "../landlord/LandlordFeedbackForm";

const ReviewsList = ({ unit_id, landlord_id }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/getReviews?unit_id=${unit_id}`);
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [unit_id]);

  // Callback function to refresh reviews after feedback submission
  const handleFeedbackSubmit = async () => {
    await fetchReviews(); // Refetch updated reviews from the backend
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold text-gray-800">Tenant Reviews</h3>

      {loading ? (
        <p className="text-gray-500 mt-2">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 mt-2">No reviews yet.</p>
      ) : (
        <div className="space-y-4 mt-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white shadow rounded-lg p-4 border"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 text-gray-700 font-semibold flex items-center justify-center rounded-full">
                  {review.tenant_first_name?.charAt(0)}
                  {review.tenant_last_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {review.tenant_first_name} {review.tenant_last_name}
                  </p>
                  <div className="flex space-x-1 text-yellow-500">
                    {[...Array(review.rating)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                    {[...Array(5 - review.rating)].map((_, i) => (
                      <span key={i} className="text-gray-300">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mt-2">{review.review_text}</p>

              {review.feedback_text ? (
                <div className="mt-3 bg-gray-100 p-3 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600">
                    <strong className="text-gray-800">
                      Landlord {review.landlord_first_name}{" "}
                      {review.landlord_last_name}:
                    </strong>{" "}
                    {review.feedback_text}
                  </p>
                </div>
              ) : (
                landlord_id && (
                  <LandlordFeedbackForm
                    review_id={review.id}
                    landlord_id={landlord_id}
                    onFeedbackSubmit={handleFeedbackSubmit} // Call function to refresh reviews
                  />
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
