import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { files, repoOwner, repoName, githubToken } = await req.json();

    if (!githubToken || !repoOwner || !repoName) {
      return Response.json({ error: 'Missing required parameters: githubToken, repoOwner, repoName' }, { status: 400 });
    }

    const baseUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents`;
    const results = [];

    for (const file of files) {
      const { name, content } = file;
      
      // Check if file exists
      const checkUrl = `${baseUrl}/${name}`;
      const checkResp = await fetch(checkUrl, {
        headers: { Authorization: `token ${githubToken}` }
      });

      let sha = null;
      if (checkResp.ok) {
        const existing = await checkResp.json();
        sha = existing.sha;
      }

      // Upload/update file
      const uploadUrl = `${baseUrl}/${name}`;
      const encodedContent = btoa(content);
      const payload = {
        message: `Data pump: ${name}`,
        content: encodedContent,
        ...(sha && { sha })
      };

      const uploadResp = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `token ${githubToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!uploadResp.ok) {
        const error = await uploadResp.text();
        results.push({ file: name, success: false, error });
      } else {
        results.push({ file: name, success: true });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});