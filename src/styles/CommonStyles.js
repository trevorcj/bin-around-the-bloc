import styled from "styled-components";

// Login & Signup

export const StyledDiv = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  overflow: hidden;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }
`;

export const HeroSection = styled.div`
  background-color: #121212;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem;
  position: relative;
  overflow: hidden;
  max-height: 100vh;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.15;
    background-image: url("/login-img.jpg");
    background-size: cover;
    background-position: center;
    /* filter: grayscale(100%); */
    z-index: 0;
  }
`;

export const StyledH1 = styled.h1`
  margin-top: 30px;
  font-size: 24px;
  color: var(--color-brand-accent);
  font-weight: 600;
  letter-spacing: -0.01em;
`;

//
