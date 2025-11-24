import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TELECOM_TEMPLATES = [
  {
    name: 'Fiber Installation - Residential',
    description: 'Standard residential fiber installation',
    duration_days: 1,
    checklist: [
      {
        id: 'safety',
        name: 'Safety & Compliance',
        items: [
          { id: '1', text: 'PPE check completed', completed: false },
          { id: '2', text: 'Work permit obtained', completed: false },
          { id: '3', text: 'Safety briefing completed', completed: false },
          { id: '4', text: 'Traffic control setup (if needed)', completed: false }
        ]
      },
      {
        id: 'pre',
        name: 'Pre-Installation',
        items: [
          { id: '1', text: 'Site survey completed', completed: false },
          { id: '2', text: 'Customer notification sent', completed: false },
          { id: '3', text: 'Equipment and materials verified', completed: false }
        ]
      },
      {
        id: 'install',
        name: 'Installation',
        items: [
          { id: '1', text: 'Cable routing completed', completed: false },
          { id: '2', text: 'ONT installed and powered', completed: false },
          { id: '3', text: 'Fiber spliced and tested', completed: false },
          { id: '4', text: 'Signal levels verified', completed: false }
        ]
      },
      {
        id: 'test',
        name: 'Testing & Verification',
        items: [
          { id: '1', text: 'Speed test passed', completed: false },
          { id: '2', text: 'Service activation confirmed', completed: false },
          { id: '3', text: 'Customer walkthrough completed', completed: false }
        ]
      },
      {
        id: 'close',
        name: 'Closeout',
        items: [
          { id: '1', text: 'Site cleaned up', completed: false },
          { id: '2', text: 'Documentation completed', completed: false },
          { id: '3', text: 'Customer signature obtained', completed: false },
          { id: '4', text: 'Photos uploaded', completed: false }
        ]
      }
    ]
  },
  {
    name: 'Fiber Installation - Commercial',
    description: 'Commercial fiber installation with multiple drops',
    duration_days: 2,
    checklist: [
      {
        id: 'safety',
        name: 'Safety & Compliance',
        items: [
          { id: '1', text: 'PPE and confined space gear check', completed: false },
          { id: '2', text: 'Building permits verified', completed: false },
          { id: '3', text: 'Safety plan reviewed with team', completed: false }
        ]
      },
      {
        id: 'pre',
        name: 'Pre-Installation',
        items: [
          { id: '1', text: 'Site survey and floor plan review', completed: false },
          { id: '2', text: 'Coordination with building management', completed: false },
          { id: '3', text: 'Cable pathways identified', completed: false }
        ]
      },
      {
        id: 'install',
        name: 'Installation (Multi-Day)',
        items: [
          { id: '1', text: 'Backbone cable installation', completed: false },
          { id: '2', text: 'Distribution cables run', completed: false },
          { id: '3', text: 'Patch panels installed', completed: false },
          { id: '4', text: 'All terminations completed', completed: false }
        ]
      },
      {
        id: 'test',
        name: 'Testing',
        items: [
          { id: '1', text: 'OTDR testing completed', completed: false },
          { id: '2', text: 'All drops tested and certified', completed: false }
        ]
      }
    ]
  }
];

export default function JobTemplates({ onApply }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const applyTemplate = (template) => {
    onApply({
      title: template.name,
      description: template.description,
      checklist: template.checklist,
      priority: 'high'
    });
    setDialogOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        variant="outline"
        size="sm"
        className="border-purple-300 text-purple-700 hover:bg-purple-50"
      >
        <Zap className="w-4 h-4 mr-2" />
        Use Template
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Templates - Telecom/Fiber</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TELECOM_TEMPLATES.map((template, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => applyTemplate(template)}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{template.duration_days} day{template.duration_days > 1 ? 's' : ''}</Badge>
                    <Badge variant="outline">
                      <CheckSquare className="w-3 h-3 mr-1" />
                      {template.checklist.length} sections
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    {template.checklist.map((section, sIdx) => (
                      <div key={sIdx} className="text-xs text-slate-500">
                        • {section.name} ({section.items.length} items)
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}