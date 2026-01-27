# Fix ObjectId to string conversions

# auth.controller.ts - Add .toString() to _id
$file = "src/controllers/auth.controller.ts"
$content = Get-Content $file -Raw
$content = $content -replace 'generateToken\(user\._id\)', 'generateToken(user._id.toString())'
$content = $content -replace 'generateRefreshToken\(user\._id\)', 'generateRefreshToken(user._id.toString())'
$content = $content -replace 'generateToken\(req\.user!\._id\)', 'generateToken(req.user!._id.toString())'
$content | Set-Content $file -NoNewline

# booking.controller.ts
$file = "src/controllers/booking.controller.ts"
$content = Get-Content $file -Raw
$content = $content -replace 'emitNotification\(io, req\.user!\._id,', 'emitNotification(io, req.user!._id.toString(),'
$content = $content -replace 'booking\.approvedBy = req\.user!\._id;', 'booking.approvedBy = req.user!._id.toString();'
$content = $content -replace 'booking\.userId !== req\.user!\._id', 'booking.userId !== req.user!._id.toString()'
$content | Set-Content $file -NoNewline

# certificate.controller.ts
$file = "src/controllers/certificate.controller.ts"
$content = Get-Content $file -Raw
$content = $content -replace 'event\.organizerId !== req\.user!\._id', 'event.organizerId !== req.user!._id.toString()'
$content = $content -replace 'certificate\.userId !== req\.user!\._id', 'certificate.userId !== req.user!._id.toString()'
$content | Set-Content $file -NoNewline

# chat.controller.ts
$file = "src/controllers/chat.controller.ts"
$content = Get-Content $file -Raw
$content = $content -replace '!room\.participants\.includes\(req\.user!\._id\)', '!room.participants.includes(req.user!._id.toString())'
$content = $content -replace 'senderId: req\.user!\._id,', 'senderId: req.user!._id.toString(),'
$content | Set-Content $file -NoNewline

# event.controller.ts
$file = "src/controllers/event.controller.ts"
$content = Get-Content $file -Raw
$content = $content -replace 'event\.organizerId !== req\.user!\._id', 'event.organizerId !== req.user!._id.toString()'
$content = $content -replace 'reviewedBy: req\.user!\._id,', 'reviewedBy: req.user!._id.toString(),'
$content | Set-Content $file -NoNewline

# registration.controller.ts
$file = "src/controllers/registration.controller.ts"
$content = Get-Content $file -Raw
$content = $content -replace 'emitNotification\(io, req\.user!\._id,', 'emitNotification(io, req.user!._id.toString(),'
$content | Set-Content $file -NoNewline

# sponsorship.controller.ts
$file = "src/controllers/sponsorship.controller.ts"
$content = Get-Content $file -Raw
$content = $content -replace 'sponsorship\.createdBy !== req\.user!\._id', 'sponsorship.createdBy !== req.user!._id.toString()'
$content | Set-Content $file -NoNewline

# socket.ts
$file = "src/config/socket.ts"
$content = Get-Content $file -Raw
$content = $content -replace 'socket\.user = \{ _id: decoded\.userId \} as IUser;', 'socket.user = { _id: decoded.userId, email: '''', password: '''', name: '''', role: ''student'' } as IUser;'
$content | Set-Content $file -NoNewline

Write-Host "Fixed all type issues!"
