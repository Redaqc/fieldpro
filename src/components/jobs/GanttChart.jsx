import { useMemo } from "react";
import { format, parseISO, differenceInDays, addDays, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, AlertCircle, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GanttChart({ job, technicians = [] }) {
  const allTasks = useMemo(() => {
    const tasks = [];
    
    // Extraire toutes les tâches des checklists
    (job?.checklist || []).forEach(group => {
      (group.items || []).forEach(item => {
        if (item.start_date && item.end_date) {
          const tech = technicians.find(t => t.id === item.assigned_to);
          tasks.push({
            id: item.id,
            name: item.text,
            groupName: group.name,
            startDate: parseISO(item.start_date),
            endDate: parseISO(item.end_date),
            completed: item.completed,
            progress: item.progress || 0,
            dependencies: item.dependencies || [],
            assignedTo: tech ? `${tech.first_name} ${tech.last_name}` : null,
            color: tech?.color || '#64748b'
          });
        }
      });
    });

    // Ajouter les milestones
    (job?.milestones || []).forEach(milestone => {
      if (milestone.date) {
        tasks.push({
          id: milestone.id,
          name: milestone.name,
          type: 'milestone',
          startDate: parseISO(milestone.date),
          endDate: parseISO(milestone.date),
          completed: milestone.completed,
          color: milestone.color || '#3b82f6'
        });
      }
    });

    return tasks.sort((a, b) => a.startDate - b.startDate);
  }, [job, technicians]);

  const dateRange = useMemo(() => {
    if (allTasks.length === 0) return { start: new Date(), end: addDays(new Date(), 30) };
    
    const dates = allTasks.flatMap(t => [t.startDate, t.endDate]);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return {
      start: startOfWeek(minDate, { locale: fr }),
      end: endOfWeek(maxDate, { locale: fr })
    };
  }, [allTasks]);

  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
  const weeks = Math.ceil(totalDays / 7);

  const getTaskPosition = (task) => {
    const startOffset = differenceInDays(task.startDate, dateRange.start);
    const duration = differenceInDays(task.endDate, task.startDate) + 1;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: task.type === 'milestone' ? '2px' : `${(duration / totalDays) * 100}%`
    };
  };

  if (allTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500">Aucune tâche avec dates définies</p>
        <p className="text-sm text-slate-400 mt-1">
          Ajoutez des dates de début/fin aux tâches pour voir le diagramme de Gantt
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête des semaines */}
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="flex">
          <div className="w-64 flex-shrink-0 border-r p-2 font-semibold text-sm">
            Tâche / Jalon
          </div>
          <div className="flex-1 flex">
            {Array.from({ length: weeks }).map((_, weekIdx) => {
              const weekStart = addDays(dateRange.start, weekIdx * 7);
              return (
                <div 
                  key={weekIdx}
                  className="flex-1 text-center border-r p-2 text-xs font-medium text-slate-600"
                  style={{ minWidth: '100px' }}
                >
                  Sem. {format(weekStart, 'w', { locale: fr })}
                  <div className="text-xs text-slate-400">
                    {format(weekStart, 'dd MMM', { locale: fr })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grille de jours */}
      <div className="space-y-2">
        {allTasks.map(task => (
          <div key={task.id} className="flex items-center group hover:bg-slate-50">
            {/* Nom de la tâche */}
            <div className="w-64 flex-shrink-0 border-r p-2">
              <div className="flex items-center gap-2">
                {task.type === 'milestone' ? (
                  <Flag className="w-4 h-4 flex-shrink-0" style={{ color: task.color }} />
                ) : (
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: task.color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-slate-400' : ''}`}>
                    {task.name}
                  </p>
                  {task.groupName && (
                    <p className="text-xs text-slate-400 truncate">{task.groupName}</p>
                  )}
                  {task.assignedTo && (
                    <p className="text-xs text-slate-500 truncate">{task.assignedTo}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 relative h-12 bg-slate-50">
              {/* Grille verticale */}
              {Array.from({ length: weeks }).map((_, idx) => (
                <div 
                  key={idx}
                  className="absolute top-0 bottom-0 border-r border-slate-200"
                  style={{ left: `${(idx / weeks) * 100}%` }}
                />
              ))}

              {/* Barre de tâche / Milestone */}
              <div
                className="absolute top-1/2 -translate-y-1/2"
                style={getTaskPosition(task)}
              >
                {task.type === 'milestone' ? (
                  <div 
                    className="w-3 h-3 rotate-45 border-2"
                    style={{ 
                      backgroundColor: task.color,
                      borderColor: task.color,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title={`${task.name} - ${format(task.startDate, 'dd MMM yyyy', { locale: fr })}`}
                  />
                ) : (
                  <div className="relative group/bar">
                    <div
                      className="h-8 rounded-md shadow-sm transition-all duration-200 group-hover/bar:shadow-md"
                      style={{
                        backgroundColor: task.completed ? '#d1d5db' : task.color,
                        opacity: task.completed ? 0.6 : 0.9
                      }}
                    >
                      {/* Barre de progression */}
                      {task.progress > 0 && !task.completed && (
                        <div
                          className="absolute inset-0 rounded-md"
                          style={{
                            width: `${task.progress}%`,
                            backgroundColor: task.color,
                            opacity: 0.5,
                            filter: 'brightness(1.2)'
                          }}
                        />
                      )}
                      
                      {/* Label */}
                      <div className="absolute inset-0 flex items-center px-2">
                        <span className="text-xs font-medium text-white truncate">
                          {task.progress > 0 && !task.completed && `${task.progress}%`}
                        </span>
                      </div>
                    </div>

                    {/* Tooltip */}
                    <div className="absolute left-0 top-full mt-1 bg-slate-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover/bar:opacity-100 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                      {task.name}
                      <div className="text-slate-300">
                        {format(task.startDate, 'dd MMM', { locale: fr })} - {format(task.endDate, 'dd MMM', { locale: fr })}
                      </div>
                      {task.assignedTo && (
                        <div className="text-slate-300">Assigné à: {task.assignedTo}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dépendances */}
              {task.dependencies?.length > 0 && (
                <div className="absolute left-0 top-0 pointer-events-none">
                  <AlertCircle className="w-3 h-3 text-orange-500" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Légende</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Tâche en cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-300 rounded"></div>
              <span>Tâche terminée</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-blue-500" />
              <span>Jalon</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span>Dépendances</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}