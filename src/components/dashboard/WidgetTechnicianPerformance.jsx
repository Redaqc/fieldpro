import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function WidgetTechnicianPerformance({ jobs = [], technicians = [] }) {
  const techPerformance = technicians.map(tech => {
    const techJobs = jobs.filter(job => 
      job.technicians?.some(t => t.id === tech.id) || job.technician_id === tech.id
    );
    
    const completed = techJobs.filter(j => j.status === 'completed').length;
    const total = techJobs.length;
    const hoursSpent = techJobs.reduce((sum, job) => {
      const techData = job.technicians?.find(t => t.id === tech.id);
      return sum + (techData?.time_spent || 0);
    }, 0);

    return {
      name: `${tech.first_name} ${tech.last_name}`,
      completed,
      hours: hoursSpent,
    };
  }).filter(t => t.completed > 0 || t.hours > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance des Techniciens</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={techPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completed" fill="#3b82f6" name="Jobs complétés" />
            <Bar dataKey="hours" fill="#10b981" name="Heures" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}