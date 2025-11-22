import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Flag, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS } from "@/constants/statuses";

export default function WidgetProjectProgress({ jobs }) {
  const activeProjects = jobs
    .filter(job =>
      job.status !== JOB_STATUS.ARCHIVED &&
      job.status !== JOB_STATUS.COMPLETED &&
      (job.milestones?.length > 0 || job.checklist?.length > 0)
    )
    .map(job => {
      // Calculer progression checklist
      const allTasks = job.checklist?.flatMap(g => g.items || []) || [];
      const completedTasks = allTasks.filter(t => t.completed).length;
      const checklistProgress = allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0;
      
      // Calculer progression jalons
      const completedMilestones = job.milestones?.filter(m => m.completed).length || 0;
      const totalMilestones = job.milestones?.length || 0;
      const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
      
      // Moyenne des deux
      const overallProgress = allTasks.length > 0 || totalMilestones > 0
        ? (checklistProgress + milestoneProgress) / (allTasks.length > 0 && totalMilestones > 0 ? 2 : 1)
        : 0;
      
      return {
        ...job,
        progress: Math.round(overallProgress),
        tasksCompleted: completedTasks,
        tasksTotal: allTasks.length,
        milestonesCompleted: completedMilestones,
        milestonesTotal: totalMilestones,
      };
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Avancement Projets Clés
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeProjects.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Aucun projet actif avec suivi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProjects.map(project => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{project.title}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {project.tasksTotal > 0 && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {project.tasksCompleted}/{project.tasksTotal} tâches
                        </span>
                      )}
                      {project.milestonesTotal > 0 && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          {project.milestonesCompleted}/{project.milestonesTotal} jalons
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-bold">
                    {project.progress}%
                  </Badge>
                </div>
                <div className="relative">
                  <Progress value={project.progress} className="h-2" />
                  <div 
                    className={`absolute inset-0 rounded-full ${getProgressColor(project.progress)} opacity-100`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}