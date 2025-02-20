import React, { useState, useEffect } from 'react';
import '../App'; // Ensure your styles are linked correctly
import Layout from "./Layout";
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Button from 'react-bootstrap/Button';
import ProfileOverview from "../components/ProfileOverview"
import "bootstrap/dist/css/bootstrap.min.css";

const Profile = () => {
    return (
        <Layout title="Profile">
            <Container className="mt-4">
                <Card className="p-4" style={{ width: '70rem', textAlign: 'left' }}>
                    {/* Top Header with Profile and Register Button */}
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold">Profile</h5>
                    </div>

                    {/* Tabs Section */}
                    <Tabs defaultActiveKey="overview" id="profile-tabs" className="mt-3">
                        <Tab eventKey="overview" title="Overview" className="mt-4">
                            <ProfileOverview />
                        </Tab>
                        <Tab eventKey="preferences" title="Preferences" className="mt-4">
                            <p>Preferences settings go here...</p>
                        </Tab>
                        <Tab eventKey="groups" title="Groups" className="mt-4">
                            <p>Group details go here...</p>
                        </Tab>
                    </Tabs>
                </Card>
            </Container>
        </Layout>
    );
};

export default Profile;
