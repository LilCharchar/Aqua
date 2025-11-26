import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export async function uploadImage(file:File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const {error: uploadError} = await supabase.storage
    .from('platillos')
    .upload(`imagenes/${fileName}`, file);

    if(uploadError) throw uploadError;

    const{data} = supabase.storage
    .from('platillos')
    .getPublicUrl(`imagenes/${fileName}`)

    return data.publicUrl

}