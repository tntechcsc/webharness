# Mangrove

<p align="center">
  <img width="250" src="/img/Mangrove_Logo_Only.svg">
</p>


This project would entail development of a demonstration harness, controllable from a web interface. This harness would be capable of handling launching of different applications (e.g. java applications, AR/VR applications, python scripts, etc.) on the host machine (stretch goal: from other, networked machines). The web interface would be a locally hosted web page/site, and would be extensible to add/remove applications ad hoc. 

Windows exclusive

perl is required
download it here: https://strawberryperl.com/
or run this shell script:
```
Invoke-WebRequest -Uri https://strawberryperl.com/download/5.32.1.1/strawberry-perl-5.32.1.1-64bit.msi -OutFile strawberry-perl.msi
```

to run the backend head to /backend/ and run `cargo run`

to run the frontend head to /frontend/ and run `npm start`
