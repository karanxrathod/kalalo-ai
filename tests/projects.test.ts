import { describe, it, expect, beforeEach } from "vitest";
import { ProjectsService } from "../src/services/projects.service.js";

describe("ProjectsService", () => {
  it("lists existing or seeded projects", () => {
    const list = ProjectsService.listProjects();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("creates, retrieves, updates, and deletes a project", () => {
    const project = ProjectsService.createProject({
      name: "Unit Test Project",
      fileName: "test-video.mp4",
      filePath: "/path/to/test-video.mp4",
      durationSeconds: 12.5,
      language: "en",
      provider: "gemini",
    });

    expect(project.id).toBeDefined();
    expect(project.name).toBe("Unit Test Project");
    expect(project.status).toBe("uploaded");

    const fetched = ProjectsService.getProject(project.id);
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(project.id);

    const updated = ProjectsService.updateProject(project.id, {
      status: "ready_to_edit",
      segments: [
        {
          id: "seg-test-1",
          start: 0,
          end: 2,
          text: "Test subtitle segment",
        },
      ],
    });

    expect(updated?.status).toBe("ready_to_edit");
    expect(updated?.segments.length).toBe(1);

    const deleted = ProjectsService.deleteProject(project.id);
    expect(deleted).toBe(true);

    const afterDelete = ProjectsService.getProject(project.id);
    expect(afterDelete).toBeUndefined();
  });
});
