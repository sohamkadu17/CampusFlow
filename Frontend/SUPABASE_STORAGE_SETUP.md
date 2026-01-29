# Supabase Storage Setup for File Uploads

## Quick Setup (5 minutes)

### Step 1: Create Storage Bucket
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **Storage** in left sidebar
4. Click **New Bucket**
5. Enter bucket name: `event-files`
6. Set **Public bucket**: ✅ **ON** (so files are publicly accessible)
7. Click **Create bucket**

### Step 2: Set Storage Policies (Important!)
1. Click on the `event-files` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Select **For full customization**
5. Add these 2 policies:

**Policy 1: Allow Upload (INSERT)**
```sql
-- Name: Allow authenticated users to upload
-- Operation: INSERT
-- Policy:
(auth.role() = 'authenticated')
```

**Policy 2: Allow Public Read (SELECT)**
```sql
-- Name: Allow public to read files
-- Operation: SELECT  
-- Policy:
true
```

### Step 3: Done! ✅
Your file uploads will now work automatically. No extra configuration needed!

---

## What This Does:
- ✅ Uploads rulebook PDFs to Supabase Storage
- ✅ Generates public URLs for admin to view
- ✅ Free tier: 1GB storage
- ✅ Already integrated with your project

## File Structure:
```
event-files/
  └── rulebooks/
      ├── 1706543210123-abc123.pdf
      ├── 1706543210456-xyz789.pdf
      └── ...
```

## No Cloudinary Needed! 🎉
All file uploads now use Supabase Storage which you already have configured.
