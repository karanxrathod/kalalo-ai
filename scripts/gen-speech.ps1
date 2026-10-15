Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$target = Join-Path (Get-Location) "samples\speech-sample.wav"
$synth.SetOutputToWaveFile($target)
$synth.Speak("Welcome to Kalalo. Create crisp captions with Google Gemini AI.")
$synth.Dispose()
Write-Host "Generated speech at $target"
