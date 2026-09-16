import sample from "../samples/gsl.json";
import { Editor } from "../components/Editor";
import { renderDispatchConfigured } from "../lib/github";
import { editorPassword } from "../lib/auth";
import type { Timeline } from "../lib/timeline";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Editor
      sample={sample as Timeline}
      previewUrl={process.env.PREVIEW_VIDEO_URL?.trim() || ""}
      authRequired={Boolean(editorPassword())}
      renderConfigured={renderDispatchConfigured()}
    />
  );
}
