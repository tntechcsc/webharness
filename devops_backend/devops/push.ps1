

Function Invoke-CommandLine 
{
    param(  
        # Executable name or path
        [string]$CommandLine, 

        # Switches or Arguments to be passed
        [string] $Arguments, 

        # If this switch is given, function returns the standard output of the process, else it returns exitcode
        [switch] $ReturnStdOut,

        # Wait time.
        # -1 indicates wait till exit, 0 indicates no wait and any +ve int will be used as wait time in seconds
        [int] $WaitTime = 0 # enter -1, 0 or + integer        
    )
    
    $psExitCode = -1
    $OutVar = ""
    
    Write-Host "Invoke-CommandLine: $CommandLine $Arguments" | Out-Null    
    try 
    {        
        $ps = new-object System.Diagnostics.Process
        $ps.StartInfo.Filename = $CommandLine
        $ps.StartInfo.Arguments = $Arguments
        $ps.StartInfo.RedirectStandardOutput = $True
        $ps.StartInfo.UseShellExecute = $false
        $ps.StartInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
        $ps.Start() | Out-Null

        if($WaitTime -ne 0)
        {
            $ps.WaitForExit($WaitTime)
        }

        [string] $OutVar = $ps.StandardOutput.ReadToEnd();
        $psExitCode = $ps.ExitCode

    }
    catch {
        Write-Host "Invoke-CommandLine: Exception when running process. Details: $($_.Exception.Message)"  | Out-Null
    }

    if($ReturnStdOut)
    {
        return $OutVar
    }
    else {
        return $psExitCode
    }
}


#param ($refs)


$branch = ($args[0] -split "/")[-1]


cd C:\4610



# git checkout branch from cli params

git checkout $branch

# Pull latest from github
git pull --all


################### RUST STUFF ###################

# cd C:\4610\backend
# cargo run


################### REACT STUFF ###################

# cd C:\4610\frontend
#$output = Invoke-CommandLine -CommandLine '& "C:/Program Files/nodejs/npm."' -Arguments "start" -ReturnStdOut
#$process = Start-Process -Filepath "C:\Program Files\nodejs\npm.cmd" -ArgumentList "start" -NoNewWindow -PassThru -WorkingDirectory "C:\4610\frontend"
#
#Start-Sleep -Seconds 5
#
#if ($process.HasExited) {
#	$output = "npm start failed with exit code $($process.exitcode))"
#}
#else {
#	$output = "npm start successfully started react server"
#	
#}


################### LOGGING ###################

$Body = @{
	'username' = "Devops"
	'content' = "Build process ran for branch: $branch"
}


iwr -Uri "https://discord.com/api/webhooks/1313906006496907320/o9DGdbFOLgATtelVzHXVvNE4Q0ace5jpqKywsLTo-6dJBmJitO-5gVlcW4hF0zAN0K3q" -Headers @{'ContentType' = 'application/json'} -Method 'POST' -Body $Body

# Get Date and Time
$data = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Create filename for logs
$filename = Get-Date -Format "yyyy-MM-dd"

# pre-made logging message
$log = "Server has started and local $branch branch has been updated"

# log + date
$finalLogMessage = "[$data] $log"

# Write to console
Write-Output $finalLogMessage

# write to file
$LogfilePath = "C:\4610\devops_backend\logs\$filename.log"
Add-Content -Path $LogfilePath -Value $finalLogMessage
