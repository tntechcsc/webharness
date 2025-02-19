import React, { useState, useEffect } from 'react';
import '../App'; // Ensure your styles are linked correctly
import Layout from "./Layout";
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import "bootstrap/dist/css/bootstrap.min.css";

const Profile = () => {
    const [isLoading, setIsLoading] = useState(true);
  
    // Simulate a delay before showing the page content
    useEffect(() => {
      setTimeout(() => {
        setIsLoading(false);
      }, 3000); // Adjust timing as needed
    }, []);
  
    return (
        <Layout title="Profile">
            <Container className="mt-4">
                <Card >
                    <Card.Body>
                        <Card.Title>Profile</Card.Title>
                        <div>
                            <Card.Text>
                                Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!Welcome to your profile page!
                            </Card.Text>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </Layout> 
    );
};

export default Profile;
