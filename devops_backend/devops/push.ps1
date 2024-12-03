
cd C:\4610\devops_backend

git pull --all

################### RUST STUFF ###################




################### REACT STUFF ###################



################### LOGGING ###################


# Get Date and Time
$data = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Create filename for logs
$filename = Get-Date -Format "yyyy-MM-dd"

# pre-made logging message
$log = "Server has started and local repository has been updated"

# log + date
$finalLogMessage = "[$data] $log"

# Write to console
Write-Output $finalLogMessage

# write to file
$LogfilePath = "C:\4610\devops_backend\logs\$filename.log"
Add-Content -Path $LogfilePath -Value $finalLogMessage