"use client";

import { useState, useEffect } from "react";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { TEMPLATES } from "@/lib/default-templates";
import { defaultTemplates } from "@/components/default-templates"; // Import default templates

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-64 border rounded-md flex items-center justify-center">
      Loading editor...
    </div>
  ),
});

export default function TemplateStep({
  templateFile,
  setTemplateFile,
  templateHtml,
  setTemplateHtml,
  templatePreview,
  setTemplatePreview,
  placeholders,
  setPlaceholders,
  onNext,
}: {
  templateFile: File | null;
  setTemplateFile: (file: File | null) => void;
  templatePreview: string | null;
  setTemplatePreview: (preview: string | null) => void;
  placeholders: string[];
  setPlaceholders: (placeholders: string[]) => void;
  templateHtml: string | null;
  setTemplateHtml: (html: string | null) => void;
  onNext: () => void;
}) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    // Handle hydration issues with ReactQuill
    // Dynamically import Quill and register the required modules and formats
    if (typeof window !== "undefined") {
      import("react-quill-new").then(({ Quill }) => {
        // Quill.register("modules/imageResize", ImageResize);

        // Explicitly register the list and bullet formats
        const List = Quill.import("formats/list");
        Quill.register("formats/list", List);
      });
    }
    setMounted(true);
  }, []);

  const handleFileChange = (file: File | null) => {
    setTemplateFile(file);
    setFile(file);
    if (file) {
      handleTemplateUpload(file);
    } else {
      setTemplatePreview(null);
      setTemplateHtml(null);
      setPlaceholders([]);
    }
  };

  const handleTemplateUpload = async (file: File) => {
    setTemplateFile(file);
    setTemplateHtml(null);
    if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
      const arrayBuffer = await file.arrayBuffer();
      const { value: htmlContent } = await import("mammoth").then((m) =>
        m.convertToHtml({ arrayBuffer })
      );

      const styledHtmlContent = `
      <style>
        p { margin-bottom: 1em; }
      </style>
      ${htmlContent}
     `;

      setTemplatePreview(styledHtmlContent);
      // Extract placeholders
      const matches = htmlContent.match(/{(.*?)}/g) || [];
      setPlaceholders(
        matches.map((placeholder) => placeholder.replace(/[{}]/g, ""))
      );
    } else if (file.name.endsWith(".html")) {
      const textContent = await file.text();
      setTemplatePreview(textContent);

      // Extract placeholders
      const matches = textContent.match(/{(.*?)}/g) || [];
      setPlaceholders(
        matches.map((placeholder) => placeholder.replace(/[{}]/g, ""))
      );
    } else {
      setTemplatePreview("Unsupported file format for preview.");
    }
  };

  const handleEditorSave = (name: string, content: string) => {
    setTemplateName(name);
    setTemplatePreview(content);
    setTemplateHtml(content);

    // Extract placeholders
    const matches = content.match(/{(.*?)}/g) || [];
    setPlaceholders(
      matches.map((placeholder) => placeholder.replace(/[{}]/g, ""))
    );

    setIsEditorOpen(false);
  };

  const handleCancelEditing = () => {
    setIsEditorOpen(false);
  };

  const handleEditTemplate = () => {
    setEditorContent(templatePreview || "");
    setIsEditorOpen(true);
  };

  const handleSelectDefaultTemplate = (template: {
    name: string;
    content: string;
  }) => {
    setTemplateName(template.name);
    setTemplatePreview(template.content);
    setTemplateHtml(template.content);

    // Extract placeholders
    const matches = template.content.match(/{(.*?)}/g) || [];
    setPlaceholders(
      matches.map((placeholder) => placeholder.replace(/[{}]/g, ""))
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Step 1: Choose or Create a Template
      </h2>
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setIsEditorOpen(true)}>
          Create Template with Editor
        </Button>
        <FileUploader
          id="template"
          accept=".docx,.doc,.html"
          onChange={handleFileChange}
          value={templateFile}
          placeholder="Upload document template (.docx, .doc, .html)"
        />
        <div>
          <h3 className="text-sm font-medium mb-2">Default Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                onClick={() => handleSelectDefaultTemplate(template)}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {templatePreview && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Template Preview</h3>
          <div
            className="text-sm bg-white p-3 border rounded-md overflow-auto"
            dangerouslySetInnerHTML={{ __html: templatePreview }}
          />
          <h4 className="text-sm font-medium mt-4">Placeholders</h4>
          <ul className="list-disc list-inside text-sm">
            {placeholders.map((placeholder, index) => (
              <li key={index}>{placeholder}</li>
            ))}
          </ul>
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleEditTemplate}
          >
            Edit Template
          </Button>
        </div>
      )}

      {isEditorOpen && (
        <div className="mt-4">
          {mounted && (
            <TemplateEditor
              onSave={handleEditorSave}
              onCancel={handleCancelEditing}
              initialContent={editorContent}
              initialName={templateName}
              buttonText="Use Template"
            />
          )}
        </div>
      )}

      <div className="mt-6">
        <Button onClick={onNext} disabled={!templatePreview}>
          Next
        </Button>
      </div>
    </div>
  );
}

function TemplateEditor({
  onSave,
  onCancel,
  initialContent,
  initialName,
  buttonText,
}: {
  onSave: (name: string, content: string) => void;
  onCancel: () => void;
  initialContent: string;
  initialName: string;
  buttonText: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [name, setName] = useState(initialName);

  const handleSave = () => {
    if (name.trim() && content.trim()) {
      onSave(name, content);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="template-name">Template Name</label>
        <input
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter template name"
          className="border rounded-md p-2 w-full"
        />
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim() || !content.trim()}>
          {buttonText}
        </Button>
      </div>

      <div className="space-y-2">
        <label htmlFor="template-content">Template Content</label>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          className="h-64"
        />
      </div>
    </div>
  );
}
