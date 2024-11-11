import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { Accordion, Modal } from "react-bootstrap";
import axiosInstance from "../../common/AxiosInstance";
import ReactPlayer from "react-player";
import { UserContext } from "../../../App";
import NavBar from "../../common/NavBar";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Button } from "@mui/material";

const CourseContent = () => {
  const user = useContext(UserContext);
  const { courseId, courseTitle } = useParams();
  const [courseContent, setCourseContent] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [playingSectionIndex, setPlayingSectionIndex] = useState(-1);
  const [completedSections, setCompletedSections] = useState([]);
  const [completedModule, setCompletedModule] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [certificate, setCertificate] = useState(null);

  // List of completed section IDs
  const completedModuleIds = completedModule.map((item) => item.sectionId);

  // Function to mark section as completed
  const completeModule = (sectionId) => {
   setCompletedSections((prevCompletedSections) => [
     ...prevCompletedSections,
     sectionId,
   ]);
 
   axiosInstance
     .post(
       `/api/user/completemodule`,
       { courseId, sectionId },
       {
         headers: {
           Authorization: `Bearer ${localStorage.getItem("token")}`,
         },
       }
     )
     .then((response) => {
       // Check for success first
       if (response.data.success) {
         console.log(`Section ${sectionId} marked as completed successfully`);
       } else {
         // If success is false, handle the failure message properly
         console.error(`Failed to mark section ${sectionId} as completed: ${response.data.message}`);
       }
     })
     .catch((error) => {
       // Log the error if the request fails entirely
       console.error(`Error marking section ${sectionId} as completed:`, error);
     });
 };
 
 
 
  const downloadPdfDocument = (rootElementId) => {
    const input = document.getElementById(rootElementId);
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "JPEG", 0, 0);
      pdf.save("download-certificate.pdf");
    });
  };

  const getCourseContent = async () => {
    try {
      const res = await axiosInstance.get(
        `/api/user/coursecontent/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        const courseContentData = res.data.courseContent || [];
        const completeModuleData = res.data.completeModule || [];
        const certificateData = res.data.certficateData || {};

        setCourseContent(courseContentData);
        setCompletedModule(completeModuleData);
        setCertificate(certificateData.updatedAt || "No certificate available");
      } else {
        console.error("Failed to retrieve course content:", res.data.message);
      }
    } catch (error) {
      console.error("Error fetching course content:", error);
    }
  };

  useEffect(() => {
    if (courseId) {
      getCourseContent();
    }
  }, [courseId]);

  // Define the playVideo function to handle video playback
  const playVideo = (videoUrl, sectionIndex) => {
    setCurrentVideo(videoUrl);
    setPlayingSectionIndex(sectionIndex);
  };

  return (
    <>
      <NavBar />
      <h1 className="my-3 text-center">Welcome to the course: {courseTitle}</h1>

      <div className="course-content">
        <div className="course-section">
          <Accordion defaultActiveKey="0" flush>
            {courseContent.map((section, index) => {
              const sectionId = index;
              const isSectionIncomplete =
                !completedModuleIds.includes(sectionId);

              return (
                <Accordion.Item key={index} eventKey={index.toString()}>
                  <Accordion.Header>{section.S_title}</Accordion.Header>
                  <Accordion.Body>
                    {section.S_description}
                    {section.S_content && (
                      <>
                        <Button
                          color="success"
                          className="mx-2"
                          variant="text"
                          size="small"
                          onClick={() =>
                            playVideo(
                              `http://localhost:5000${section.S_content.path}`,
                              index
                            )
                          }
                        >
                          Play Video
                        </Button>
                        {isSectionIncomplete &&
                          !completedSections.includes(index) && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => completeModule(sectionId)}
                              disabled={playingSectionIndex !== index}
                            >
                              Completed
                            </Button>
                          )}
                      </>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              );
            })}
            {completedModule.length === courseContent.length && (
              <Button className="my-2" onClick={() => setShowModal(true)}>
                Download Certificate
              </Button>
            )}
          </Accordion>
        </div>
        <div className="course-video w-50">
          {currentVideo && (
            <ReactPlayer
              url={currentVideo}
              width="100%"
              height="100%"
              controls
            />
          )}
        </div>
      </div>
      <Modal
        size="lg"
        show={showModal}
        onHide={() => setShowModal(false)}
        dialogClassName="modal-90w"
        aria-labelledby="example-custom-modal-styling-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="example-custom-modal-styling-title">
            Completion Certificate
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Congratulations! You have completed all sections. Here is your
          certificate
          <div id="certificate-download" className="certificate text-center">
            <h1>Certificate of Completion</h1>
            <div className="content">
              <p>This is to certify that</p>
              <h2>{user.userData.name}</h2>
              <p>has successfully completed the course</p>
              <h3>{courseTitle}</h3>
              <p>on</p>
              <p className="date">
                {new Date(certificate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button
            onClick={() => downloadPdfDocument("certificate-download")}
            style={{ float: "right", marginTop: 3 }}
          >
            Download Certificate
          </Button>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CourseContent;
