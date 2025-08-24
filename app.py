import streamlit as st
import PyPDF2
import faiss
import numpy as np
import pickle
import os
from sentence_transformers import SentenceTransformer
import openai
from typing import List, Tuple
import re
import io

class PDFProcessor:
    def __init__(self):
        # Initialize the embedding model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.vector_db = None
        self.chunks = []
        self.chunk_metadata = []
        
    def extract_text_from_pdf(self, pdf_file) -> str:
        """Extract text from uploaded PDF file"""
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                text += f"\n[PAGE {page_num + 1}]\n{page_text}\n"
            return text
        except Exception as e:
            st.error(f"Error reading PDF: {str(e)}")
            return ""
    
    def chunk_text(self, text: str, pdf_name: str) -> List[str]:
        """Intelligently chunk text by paragraphs and sentences"""
        # Remove extra whitespace and normalize text
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Split by paragraphs first
        paragraphs = text.split('\n\n')
        chunks = []
        
        for para in paragraphs:
            para = para.strip()
            if len(para) < 50:  # Skip very short paragraphs
                continue
                
            # If paragraph is too long, split by sentences
            if len(para) > 1000:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                current_chunk = ""
                
                for sentence in sentences:
                    if len(current_chunk + sentence) < 1000:
                        current_chunk += sentence + " "
                    else:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = sentence + " "
                
                if current_chunk:
                    chunks.append(current_chunk.strip())
            else:
                chunks.append(para)
        
        # Store metadata for each chunk
        for i, chunk in enumerate(chunks):
            self.chunk_metadata.append({
                'pdf_name': pdf_name,
                'chunk_id': len(self.chunks) + i,
                'text': chunk
            })
        
        return chunks
    
    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for text chunks"""
        embeddings = self.embedding_model.encode(texts)
        return embeddings
    
    def create_vector_database(self, embeddings: np.ndarray):
        """Create FAISS vector database"""
        dimension = embeddings.shape[1]
        self.vector_db = faiss.IndexFlatL2(dimension)
        self.vector_db.add(embeddings.astype('float32'))
    
    def process_pdfs(self, pdf_files):
        """Process multiple PDF files"""
        all_chunks = []
        
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        for i, pdf_file in enumerate(pdf_files):
            status_text.text(f"Processing {pdf_file.name}...")
            
            # Extract text
            text = self.extract_text_from_pdf(pdf_file)
            if not text:
                continue
            
            # Chunk text
            chunks = self.chunk_text(text, pdf_file.name)
            all_chunks.extend(chunks)
            self.chunks.extend(chunks)
            
            progress_bar.progress((i + 1) / len(pdf_files))
        
        if all_chunks:
            status_text.text("Generating embeddings...")
            # Generate embeddings
            embeddings = self.generate_embeddings(all_chunks)
            
            # Create vector database
            self.create_vector_database(embeddings)
            
            # Save to disk
            self.save_data()
            
            status_text.text(f"Successfully processed {len(pdf_files)} PDFs with {len(all_chunks)} chunks")
        else:
            status_text.text("No content found in PDFs")
    
    def save_data(self):
        """Save processed data to disk"""
        if not os.path.exists('data'):
            os.makedirs('data')
        
        # Save vector database
        faiss.write_index(self.vector_db, 'data/vector_db.index')
        
        # Save chunks and metadata
        with open('data/chunks.pkl', 'wb') as f:
            pickle.dump(self.chunks, f)
        
        with open('data/metadata.pkl', 'wb') as f:
            pickle.dump(self.chunk_metadata, f)
    
    def load_data(self):
        """Load processed data from disk"""
        try:
            if os.path.exists('data/vector_db.index'):
                self.vector_db = faiss.read_index('data/vector_db.index')
            
            if os.path.exists('data/chunks.pkl'):
                with open('data/chunks.pkl', 'rb') as f:
                    self.chunks = pickle.load(f)
            
            if os.path.exists('data/metadata.pkl'):
                with open('data/metadata.pkl', 'rb') as f:
                    self.chunk_metadata = pickle.load(f)
            
            return len(self.chunks) > 0
        except Exception as e:
            st.error(f"Error loading data: {str(e)}")
            return False
    
    def search_similar_chunks(self, query: str, top_k: int = 3) -> List[Tuple[str, float]]:
        """Search for similar chunks using vector similarity"""
        if self.vector_db is None:
            return []
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query])
        
        # Search in vector database
        distances, indices = self.vector_db.search(query_embedding.astype('float32'), top_k)
        
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(self.chunks):
                results.append((self.chunks[idx], float(distance)))
        
        return results

class LLMHandler:
    def __init__(self):
        self.openai_api_key = None
    
    def set_api_key(self, api_key: str):
        """Set OpenAI API key"""
        self.openai_api_key = api_key
        openai.api_key = api_key
    
    def generate_answer(self, query: str, context_chunks: List[str]) -> str:
        """Generate answer using OpenAI API"""
        if not self.openai_api_key:
            return "Please set your OpenAI API key to generate answers."
        
        # Prepare context
        context = "\n\n".join(context_chunks)
        
        # Create prompt
        prompt = f"""Based on the following context from the uploaded documents, answer the user's question. If the answer cannot be found in the context, say so clearly.

Context:
{context}

Question: {query}

Answer:"""
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that answers questions based only on the provided document context."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.1
            )
            
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            return f"Error generating answer: {str(e)}"

def main():
    st.set_page_config(
        page_title="PDF AI Assistant",
        page_icon="📚",
        layout="wide"
    )
    
    st.title("📚 PDF AI Assistant")
    st.markdown("Upload PDF documents and ask questions about their content using AI")
    
    # Initialize session state
    if 'pdf_processor' not in st.session_state:
        st.session_state.pdf_processor = PDFProcessor()
        st.session_state.llm_handler = LLMHandler()
        st.session_state.pdf_processor.load_data()
    
    # Sidebar for configuration
    with st.sidebar:
        st.header("Configuration")
        
        # OpenAI API Key
        api_key = st.text_input("OpenAI API Key", type="password", 
                               help="Required for generating answers")
        if api_key:
            st.session_state.llm_handler.set_api_key(api_key)
        
        st.divider()
        
        # File upload section
        st.header("Upload PDFs")
        uploaded_files = st.file_uploader(
            "Choose PDF files",
            type="pdf",
            accept_multiple_files=True,
            help="Upload one or more PDF files"
        )
        
        if uploaded_files:
            if st.button("Process PDFs", type="primary"):
                with st.spinner("Processing PDFs..."):
                    st.session_state.pdf_processor.process_pdfs(uploaded_files)
                st.success("PDFs processed successfully!")
                st.rerun()
        
        # Show current status
        if len(st.session_state.pdf_processor.chunks) > 0:
            st.success(f"📄 {len(st.session_state.pdf_processor.chunks)} chunks loaded")
            
            # Show processed files
            processed_files = set([metadata['pdf_name'] for metadata in st.session_state.pdf_processor.chunk_metadata])
            st.markdown("**Processed files:**")
            for file in processed_files:
                st.markdown(f"• {file}")
    
    # Main interface
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.header("Ask Questions")
        
        if len(st.session_state.pdf_processor.chunks) == 0:
            st.info("👈 Please upload and process PDF files first")
        else:
            # Query input
            query = st.text_input("Enter your question:", 
                                placeholder="What is this document about?")
            
            if st.button("Search & Answer", type="primary") and query:
                with st.spinner("Searching documents..."):
                    # Search for relevant chunks
                    similar_chunks = st.session_state.pdf_processor.search_similar_chunks(query, top_k=3)
                    
                    if similar_chunks:
                        # Extract just the text from chunks
                        context_texts = [chunk[0] for chunk in similar_chunks]
                        
                        # Generate answer
                        answer = st.session_state.llm_handler.generate_answer(query, context_texts)
                        
                        # Display answer
                        st.markdown("### Answer")
                        st.write(answer)
                        
                        # Display relevant context
                        st.markdown("### Relevant Context")
                        for i, (chunk_text, similarity_score) in enumerate(similar_chunks):
                            with st.expander(f"Context {i+1} (Similarity: {similarity_score:.4f})"):
                                st.write(chunk_text)
                    else:
                        st.warning("No relevant content found for your query.")
    
    with col2:
        st.header("Instructions")
        st.markdown("""
        **How to use:**
        1. Add your OpenAI API key in the sidebar
        2. Upload one or more PDF files
        3. Click "Process PDFs" to analyze the documents
        4. Ask questions about the content
        5. Get AI-powered answers with source context
        
        **Features:**
        - Supports multiple PDF uploads
        - Intelligent text chunking
        - Vector-based similarity search
        - Context-aware AI responses
        - Persistent data storage
        """)
        
        if len(st.session_state.pdf_processor.chunks) > 0:
            st.markdown("### Quick Stats")
            st.metric("Total Chunks", len(st.session_state.pdf_processor.chunks))
            st.metric("Processed Files", len(set([m['pdf_name'] for m in st.session_state.pdf_processor.chunk_metadata])))

if __name__ == "__main__":
    main()