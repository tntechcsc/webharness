import { useState, useEffect } from "react";
import Image from 'react-bootstrap/Image';

const ProfileOverview = () => {
    const [name, setName] = useState("John Doe");
    const [email, setEmail] = useState("enmauk.cion");
    const [role, setRole] = useState("Plebian");

    useEffect(() => {
        async function fetchData() {
            try {
                const baseURL = window.location.origin;
                let session_id = sessionStorage.getItem("session_id");
                let uri = `${baseURL}:3000/api/user/info`;
                if (!session_id) return;

                const response = await fetch(uri, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "x-session-id": session_id || "",
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    setName(data.username);
                    setEmail(data.email);
                    setRole(data.roleName);
                }
            } catch (error) {
                console.log("ERROR: " + error);
            }
        };

        fetchData();
    }, []);

    return (
        <>
        {/* Profile Info Section */}
        <div className="d-flex align-items-center">
            <div>
                <p className="mb-0"><strong>Name:</strong> {name}</p>
                <p className="mb-0"><strong>Email:</strong> {email}</p>
                <p><strong>Role:</strong> {role}</p>
            </div>
        </div>
        </>
    )
}

export default ProfileOverview;