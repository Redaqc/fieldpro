import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";

export default function FeedbackForm({ job, customer, onSubmit }) {
  const [formData, setFormData] = useState({
    rating: 0,
    quality_score: 0,
    timeliness_score: 0,
    professionalism_score: 0,
    comments: '',
    would_recommend: null
  });
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      onSubmit?.();
      alert('Thank you for your feedback!');
    },
  });

  const handleSubmit = () => {
    if (formData.rating === 0) {
      alert('Please provide a rating');
      return;
    }

    submitFeedbackMutation.mutate({
      job_id: job.id,
      customer_id: customer.id,
      customer_name: `${customer.first_name} ${customer.last_name}`,
      ...formData,
      submitted_at: new Date().toISOString()
    });
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>How was your experience?</CardTitle>
        <p className="text-sm text-slate-600">Job: {job.title}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <StarRating
          label="Overall Rating *"
          value={formData.rating}
          onChange={(v) => setFormData({ ...formData, rating: v })}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StarRating
            label="Quality of Work"
            value={formData.quality_score}
            onChange={(v) => setFormData({ ...formData, quality_score: v })}
          />
          <StarRating
            label="Timeliness"
            value={formData.timeliness_score}
            onChange={(v) => setFormData({ ...formData, timeliness_score: v })}
          />
          <StarRating
            label="Professionalism"
            value={formData.professionalism_score}
            onChange={(v) => setFormData({ ...formData, professionalism_score: v })}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Would you recommend us?</label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={formData.would_recommend === true ? 'default' : 'outline'}
              onClick={() => setFormData({ ...formData, would_recommend: true })}
              className={formData.would_recommend === true ? 'bg-green-600' : ''}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Yes
            </Button>
            <Button
              type="button"
              variant={formData.would_recommend === false ? 'default' : 'outline'}
              onClick={() => setFormData({ ...formData, would_recommend: false })}
              className={formData.would_recommend === false ? 'bg-red-600' : ''}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              No
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Additional Comments</label>
          <Textarea
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            placeholder="Tell us more about your experience..."
            rows={4}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={formData.rating === 0 || submitFeedbackMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}