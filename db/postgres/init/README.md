# Database Initialization

## Fresh Deployment

For fresh deployments, use the consolidated script:

```bash
psql -h localhost -U postgres -d badminton_db -f init_database.sql
```

This single script (`init_database.sql`) creates:
- All schemas (badminton, access_control)
- All tables with proper relationships
- All indexes for performance
- Sample data (4 users, 1 tournament, 3 matches)
- Access control system with roles and permissions

## Clean Setup

All database initialization is handled by the single `init_database.sql` script. The old numbered migration scripts have been removed as they are no longer needed.

## Sample Users

The script creates these test users (password: `password123`):
- `alice` - Alice Johnson
- `bob` - Bob Smith  
- `charlie` - Charlie Brown
- `diana` - Diana Prince

## Database Features

- **Users**: Profile pictures, roles, permissions
- **Matches**: Casual/tournament, verification system
- **Tournaments**: Invitations, participants, medals
- **Posts**: Social feed with comments, attachments, reactions
- **Reports**: Event reports with reactions and views
- **Access Control**: Role-based permissions system

## Performance

All tables include appropriate indexes for:
- User lookups (username, email)
- Match queries (players, status, type)
- Tournament operations
- Post/comment feeds
- Report views and reactions
- Full-text search on report content
