import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB / file

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Niciun fisier primit." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fisierul depaseste 25MB." }, { status: 413 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Stocarea fisierelor nu este configurata." },
      { status: 500 },
    );
  }

  const blob = await put(`quote-uploads/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url, name: file.name, size: file.size });
}
