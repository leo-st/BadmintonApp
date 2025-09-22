# Posts Feature - Social Media Style Feed

This document describes the new posts feature that adds social media-style functionality to the badminton app.

## Overview

The posts feature allows users to:
- Create text posts (similar to Facebook status updates or Twitter posts)
- Add comments to posts
- React to posts and comments with emojis
- Attach files (images, videos, documents, links, GIFs, audio) to posts and comments
- View a feed of posts from all users

## Database Schema

### Tables Created

1. **Post** - Main posts table
   - `id` - Primary key
   - `user_id` - Foreign key to User table
   - `content` - Text content of the post
   - `created_at` - Timestamp when post was created
   - `updated_at` - Timestamp when post was last updated
   - `is_deleted` - Soft delete flag

2. **Comment** - Comments on posts
   - `id` - Primary key
   - `post_id` - Foreign key to Post table
   - `user_id` - Foreign key to User table
   - `content` - Text content of the comment
   - `parent_comment_id` - For nested comments/replies
   - `created_at` - Timestamp when comment was created
   - `updated_at` - Timestamp when comment was last updated
   - `is_deleted` - Soft delete flag

3. **Attachment** - File attachments for posts and comments
   - `id` - Primary key
   - `post_id` - Foreign key to Post table (nullable)
   - `comment_id` - Foreign key to Comment table (nullable)
   - `file_type` - Type of attachment (IMAGE, VIDEO, DOCUMENT, LINK, GIF, AUDIO)
   - `file_path` - Path to the file
   - `file_name` - Original filename
   - `file_size` - Size of the file in bytes
   - `mime_type` - MIME type of the file
   - `file_metadata` - JSON metadata about the file

4. **PostReaction** - Reactions to posts
   - `id` - Primary key
   - `post_id` - Foreign key to Post table
   - `user_id` - Foreign key to User table
   - `emoji` - Emoji reaction
   - `created_at` - Timestamp when reaction was added

5. **CommentReaction** - Reactions to comments
   - `id` - Primary key
   - `comment_id` - Foreign key to Comment table
   - `user_id` - Foreign key to User table
   - `emoji` - Emoji reaction
   - `created_at` - Timestamp when reaction was added

## API Endpoints

### Posts

- `POST /posts/` - Create a new post
- `GET /posts/` - Get posts with pagination (optionally filter by user)
- `GET /posts/{post_id}` - Get a specific post
- `PUT /posts/{post_id}` - Update a post (only by author)
- `DELETE /posts/{post_id}` - Delete a post (only by author)

### Post Attachments

- `POST /posts/{post_id}/attachments` - Add attachment to a post

### Post Reactions

- `POST /posts/{post_id}/reactions` - Add reaction to a post
- `DELETE /posts/{post_id}/reactions/{emoji}` - Remove reaction from a post

### Comments

- `POST /posts/{post_id}/comments` - Create a comment on a post
- `GET /posts/{post_id}/comments` - Get comments for a post
- `PUT /posts/comments/{comment_id}` - Update a comment (only by author)
- `DELETE /posts/comments/{comment_id}` - Delete a comment (only by author)

### Comment Reactions

- `POST /posts/comments/{comment_id}/reactions` - Add reaction to a comment
- `DELETE /posts/comments/{comment_id}/reactions/{emoji}` - Remove reaction from a comment

## Usage Examples

### Create a Post

```bash
curl -X POST "http://localhost:8000/posts/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Just had an amazing badminton match! 🏸"
  }'
```

### Add an Attachment to a Post

```bash
curl -X POST "http://localhost:8000/posts/1/attachments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_type": "IMAGE",
    "file_path": "/uploads/images/match_photo.jpg",
    "file_name": "match_photo.jpg",
    "file_size": 1024000,
    "mime_type": "image/jpeg",
    "file_metadata": {
      "width": 1920,
      "height": 1080,
      "camera": "iPhone 12"
    }
  }'
```

### Add a Reaction to a Post

```bash
curl -X POST "http://localhost:8000/posts/1/reactions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emoji": "👍"
  }'
```

### Create a Comment

```bash
curl -X POST "http://localhost:8000/posts/1/comments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great match! I want to play next time!",
    "parent_comment_id": null
  }'
```

### Get Posts Feed

```bash
curl -X GET "http://localhost:8000/posts/?skip=0&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Features

### Soft Deletes
- Posts and comments use soft deletes (is_deleted flag) instead of hard deletes
- This preserves data integrity and allows for potential recovery

### Nested Comments
- Comments can have parent comments, allowing for threaded discussions
- Replies are automatically loaded when fetching comments

### Reaction System
- Users can react to both posts and comments with emojis
- Each user can only have one reaction per emoji per post/comment
- Reaction counts are automatically calculated and included in responses

### File Attachments
- Support for multiple file types (images, videos, documents, links, GIFs, audio)
- Metadata storage for additional file information
- Files can be attached to both posts and comments

### Pagination
- All list endpoints support pagination with `skip` and `limit` parameters
- Default limits are set to prevent performance issues

### Authorization
- All endpoints require authentication
- Users can only edit/delete their own posts and comments
- File attachments can only be added to posts by the post author

## Database Migration

To apply the database changes, run the SQL migration file:

```sql
-- The migration is located at:
-- db/postgres/init/010_create_posts_system.sql
```

This will create all the necessary tables, indexes, and constraints for the posts system.

## Next Steps

1. **File Upload Handling**: Implement actual file upload endpoints for handling file attachments
2. **Image Processing**: Add image resizing and optimization for uploaded images
3. **Notification System**: Add notifications for new posts, comments, and reactions
4. **Search**: Add search functionality for posts and comments
5. **Hashtags**: Add hashtag support for categorizing posts
6. **Mentions**: Add user mention functionality in posts and comments
7. **Feed Algorithm**: Implement a more sophisticated feed algorithm (chronological, engagement-based, etc.)
